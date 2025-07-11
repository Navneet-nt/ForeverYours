// server.js
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const next = require('next')
const cors = require('cors')
const helmet = require('helmet')
const { query } = require('./src/utils/db')
const { verifyToken } = require('./src/utils/auth')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// In‑memory match queues
const matchQueue = {
  male: [],
  female: [],
  addToQueue(userId, gender) {
    if (gender === 'M') this.male.push(userId)
    else this.female.push(userId)
  },
  removeFromQueue(userId) {
    this.male = this.male.filter(id => id !== userId)
    this.female = this.female.filter(id => id !== userId)
  },
  findMatch(userId, gender) {
    const opposite = gender === 'M' ? this.female : this.male
    return opposite.length ? opposite.shift() : null
  }
}

app.prepare().then(() => {
  const server = express()
  server.use(cors())
  server.use(helmet())

  const httpServer = http.createServer(server)
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET','POST'] }
  })

  // socket.id → { userId, sessionId, gender }
  const userSessions = new Map()

  io.on('connection', socket => {
    console.log('New client:', socket.id)

    let userId = null
    let sessionId = null
    let gender = null

    socket.on('authenticate', token => {
      try {
        const decoded = verifyToken(token)
        userId = decoded.userId
        gender = decoded.gender
        userSessions.set(socket.id, { userId, sessionId, gender })
        console.log(`Authenticated user ${userId}`)
      } catch (e) {
        console.error('Auth failed:', e.message)
      }
    })

    socket.on('joinSession', async ({ sessionId: sid }) => {
      try {
        sessionId = sid
        userSessions.set(socket.id, { userId, sessionId, gender })
        socket.join(sessionId)
        socket.to(sessionId).emit('userJoined', { userId, gender })
        console.log(`User ${userId} joined session ${sessionId}`)
      } catch (e) {
        console.error('Join session failed:', e.message)
      }
    })

    socket.on('chatMessage', async message => {
      if (!sessionId) return
      try {
        await query(
          'INSERT INTO Messages (sessionId, senderId, content) VALUES (?, ?, ?)',
          [sessionId, userId, message]
        )
        io.to(sessionId).emit('chatMessage', {
          userId,
          message,
          timestamp: new Date().toISOString()
        })
      } catch (e) {
        console.error('Chat message failed:', e.message)
      }
    })

    socket.on('draw', strokeData => {
      if (sessionId) socket.to(sessionId).emit('draw', strokeData)
    })

    socket.on('musicControl', event => {
      if (sessionId) io.to(sessionId).emit('musicControl', { userId, ...event })
    })

    socket.on('findMatch', async () => {
      if (!userId || !gender) return
      try {
        const partnerId = matchQueue.findMatch(userId, gender)
        if (partnerId) {
          // create session
          const result = await query(
            'INSERT INTO Sessions (creatorId) VALUES (?)',
            [userId]
          )
          const newSessionId = result.insertId

          // add both participants
          await query(
            'INSERT INTO SessionParticipants (sessionId, userId) VALUES (?, ?), (?, ?)',
            [newSessionId, userId, newSessionId, partnerId]
          )

          io.to(userId.toString()).emit('matchFound', { sessionId: newSessionId })
          io.to(partnerId.toString()).emit('matchFound', { sessionId: newSessionId })
          console.log(`Match created: ${userId} & ${partnerId} in session ${newSessionId}`)
        } else {
          // wait in queue
          matchQueue.addToQueue(userId, gender)
          socket.emit('waitingForMatch')
          console.log(`User ${userId} added to ${gender} queue`)
        }
      } catch (e) {
        console.error('Find match failed:', e.message)
      }
    })

    socket.on('cancelMatch', () => {
      if (userId) {
        matchQueue.removeFromQueue(userId)
        socket.emit('matchCancelled')
        console.log(`User ${userId} cancelled match search`)
      }
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id)
      if (userId) matchQueue.removeFromQueue(userId)
      if (sessionId) socket.to(sessionId).emit('userLeft', { userId })
      userSessions.delete(socket.id)
    })
  })

  // Let Next.js handle all other routes
  server.all('*', (req, res) => handle(req, res))

  const PORT = process.env.PORT || 3000
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
})
