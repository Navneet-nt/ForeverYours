'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function MatchPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const router = useRouter();

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
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('waitingForMatch', () => {
      setIsSearching(true);
    });

    newSocket.on('matchFound', (data: { sessionId: string }) => {
      setMatchFound(true);
      setIsSearching(false);
      setTimeout(() => {
        router.push(`/session/${data.sessionId}`);
      }, 2000);
    });

    newSocket.on('matchCancelled', () => {
      setIsSearching(false);
    });

    return () => {
      newSocket.close();
    };
  }, [router]);

  const startSearching = () => {
    if (!socket) return;
    socket.emit('findMatch');
  };

  const cancelSearch = () => {
    if (!socket) return;
    socket.emit('cancelMatch');
    setIsSearching(false);
  };

  const goBack = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Find Your Drawing Partner
        </h1>

        {/* Connection Status */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Match Found */}
        {matchFound && (
          <div className="mb-6">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <div className="text-lg font-semibold mb-2">🎉 Match Found!</div>
              <div className="text-sm">Redirecting to your session...</div>
            </div>
          </div>
        )}

        {/* Searching */}
        {isSearching && (
          <div className="mb-6">
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <div className="text-lg font-semibold mb-2">🔍 Searching...</div>
              <div className="text-sm">Looking for someone of the opposite gender</div>
              <div className="mt-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {!isSearching && !matchFound && (
            <button
              onClick={startSearching}
              disabled={!isConnected}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
            >
              Find Match
            </button>
          )}

          {isSearching && (
            <button
              onClick={cancelSearch}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-lg font-semibold"
            >
              Cancel Search
            </button>
          )}

          <button
            onClick={goBack}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 text-sm text-gray-600">
          <p className="mb-2">✨ Find someone of the opposite gender to draw with</p>
          <p className="mb-2">🎨 Collaborate on artwork in real-time</p>
          <p>💬 Chat and share your creativity</p>
        </div>
      </div>
    </div>
  );
} 