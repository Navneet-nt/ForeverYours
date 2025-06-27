'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Message {
  userId: number;
  message: string;
  timestamp: string;
}

interface DrawStroke {
  x: number;
  y: number;
  color: string;
  size: number;
  eventType: 'start' | 'move' | 'end';
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<number[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Initialize Socket.IO
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('authenticate', token);
      newSocket.emit('joinSession', { sessionId });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('chatMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('draw', (stroke: DrawStroke) => {
      drawStroke(stroke);
    });

    newSocket.on('userJoined', (user: { userId: number; gender: string }) => {
      setParticipants(prev => [...prev, user.userId]);
    });

    newSocket.on('userLeft', (user: { userId: number }) => {
      setParticipants(prev => prev.filter(id => id !== user.userId));
    });

    return () => {
      newSocket.close();
    };
  }, [sessionId, router]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.lineCap = 'round';
      context.strokeStyle = color;
      context.lineWidth = brushSize;
      contextRef.current = context;
    }
  }, [color, brushSize]);

  const drawStroke = (stroke: DrawStroke) => {
    if (!contextRef.current) return;

    const ctx = contextRef.current;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;

    if (stroke.eventType === 'start') {
      ctx.beginPath();
      ctx.moveTo(stroke.x, stroke.y);
    } else if (stroke.eventType === 'move') {
      ctx.lineTo(stroke.x, stroke.y);
      ctx.stroke();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !socket) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    const stroke: DrawStroke = { x, y, color, size: brushSize, eventType: 'start' };
    socket.emit('draw', stroke);
    drawStroke(stroke);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !socket) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const stroke: DrawStroke = { x, y, color, size: brushSize, eventType: 'move' };
    socket.emit('draw', stroke);
    drawStroke(stroke);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('chatMessage', newMessage);
    setNewMessage('');
  };

  const clearCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Session {sessionId}</h1>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {participants.length + 1} participants
            </span>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Drawing Canvas */}
        <div className="flex-1 p-4">
          <div className="bg-white rounded-lg shadow-md p-4 h-full">
            {/* Toolbar */}
            <div className="flex items-center space-x-4 mb-4">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 border rounded"
              />
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-600">{brushSize}px</span>
              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear
              </button>
            </div>

            {/* Canvas */}
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-[calc(100vh-200px)] cursor-crosshair"
              />
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-80 bg-white shadow-md flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Chat</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className="bg-gray-100 rounded-lg p-3">
                <div className="text-sm text-gray-600">User {msg.userId}</div>
                <div className="text-gray-900">{msg.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 