const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');
const cors = require('cors');
const helmet = require('helmet');
const { query } = require('./src/utils/db');
const { verifyToken } = require('./src/utils/auth');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Matching queues
const matchQueue = {
  male: [],
  female: [],
  
  addToQueue(userId, gender) {
    if (gender === 'M') {
      this.male.push(userId);
    } else {
      this.female.push(userId);
    }
  },
  
  removeFromQueue(userId) {
    this.male = this.male.filter(id => id !== userId);
    this.female = this.female.filter(id => id !== userId);
  },
  
  findMatch(userId, gender) {
    const oppositeQueue = gender === 'M' ? this.female : this.male;
    if (oppositeQueue.length > 0) {
      const partnerId = oppositeQueue.shift();
      return partnerId;
    }
    return null;
  }
};

app.prepare().then(() => {
  const server = express();
  server.use(cors());
  server.use(helmet());

  const httpServer = http.createServer(server);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Store user data
  const userSessions = new Map(); // socketId -> { userId, sessionId, gender }

  // WebSocket event handlers
  io.on('connection', (socket) => {
    console.log('New client connected, id=', socket.id);
    
    let userId = null;
    let sessionId = null;
    let gender = null;

    // Authenticate user
    socket.on('authenticate', async (token) => {
      try {
        const decoded = verifyToken(token);
        userId = decoded.userId;
        gender = decoded.gender;
        userSessions.set(socket.id, { userId, sessionId, gender });
        console.log(`User ${userId} authenticated`);
      } catch (err) {
        console.error('Authentication failed:', err.message);
      }
    });

    // Join session
    socket.on('joinSession', async (data) => {
      try {
        sessionId = data.sessionId;
        userSessions.set(socket.id, { userId, sessionId, gender });
        socket.join(sessionId);
        
        // Notify others in session
        socket.to(sessionId).emit('userJoined', { userId, gender });
        console.log(`User ${userId} joined session ${sessionId}`);
      } catch (err) {
        console.error('Join session failed:', err.message);
      }
    });

    // Chat message
    socket.on('chatMessage', async (message) => {
      try {
        if (!sessionId) return;
        
        // Save to database
        await query(
          'INSERT INTO Messages (sessionId, senderId, content) VALUES (?, ?, ?)',
          [sessionId, userId, message]
        );
        
        // Broadcast to session
        io.to(sessionId).emit('chatMessage', { 
          userId, 
          message, 
          timestamp: new Date().toISOString() 
        });
      } catch (err) {
        console.error('Chat message failed:', err.message);
      }
    });

    // Drawing event
    socket.on('draw', (strokeData) => {
      if (!sessionId) return;
      
      // Broadcast to others in session
      socket.to(sessionId).emit('draw', strokeData);
    });

    // Music control
    socket.on('musicControl', (event) => {
      if (!sessionId) return;
      
      // Broadcast to session
      io.to(sessionId).emit('musicControl', { userId, ...event });
    });

    // Find match
    socket.on('findMatch', async () => {
      try {
        if (!userId || !gender) return;
        
        const partnerId = matchQueue.findMatch(userId, gender);
        
        if (partnerId) {
          // Create session
          const result = await query('INSERT INTO Sessions (creatorId) VALUES (?)', [userId]);
          const newSessionId = result.insertId;
          
          // Add both users to session
          await query('INSERT INTO SessionParticipants (sessionId, userId) VALUES (?, ?)', [newSessionId, userId]);
          await query('INSERT INTO SessionParticipants (sessionId, userId) VALUES (?, ?)', [newSessionId, partnerId]);
          
          // Notify both users
          io.to(userId.toString()).emit('matchFound', { sessionId: newSessionId });
          io.to(partnerId.toString()).emit('matchFound', { sessionId: newSessionId });
          
          console.log(`Match created: ${userId} and ${partnerId} in session ${newSessionId}`);
        } else {
          // Add to queue
          matchQueue.addToQueue(userId, gender);
          socket.emit('waitingForMatch');
          console.log(`User ${userId} added to ${gender} queue`);
        }
      } catch (err) {
        console.error('Find match failed:', err.message);
      }
    });

    // Cancel match search
    socket.on('cancelMatch', () => {
      if (userId) {
        matchQueue.removeFromQueue(userId);
        socket.emit('matchCancelled');
        console.log(`User ${userId} cancelled match search`);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected', socket.id);
      
      // Remove from match queue
      if (userId) {
        matchQueue.removeFromQueue(userId);
      }
      
      // Leave session
      if (sessionId) {
        socket.to(sessionId).emit('userLeft', { userId });
      }
      
      // Clean up
      userSessions.delete(socket.id);
    });
  });

  // Next.js page handling
  server.all('*', (req, res) => handle(req, res));

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}); 