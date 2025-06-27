'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionLink, setSessionLink] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const createSession = async () => {
    setCreatingSession(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSessionLink(data.inviteLink);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setCreatingSession(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Collaborative Draw Chat</h1>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Session */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Session</h2>
            <p className="text-gray-600 mb-4">
              Start a new collaborative drawing session and invite a friend.
            </p>
            <button
              onClick={createSession}
              disabled={creatingSession}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {creatingSession ? 'Creating...' : 'Create Session'}
            </button>
            {sessionLink && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800 mb-2">Session created! Share this link:</p>
                <input
                  type="text"
                  value={sessionLink}
                  readOnly
                  className="w-full text-sm bg-white border border-green-300 rounded px-2 py-1"
                />
              </div>
            )}
          </div>

          {/* Find Match */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Match</h2>
            <p className="text-gray-600 mb-4">
              Find someone of the opposite gender to draw with instantly.
            </p>
            <Link
              href="/match"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            >
              Find Match
            </Link>
          </div>

          {/* Join Session */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Session</h2>
            <p className="text-gray-600 mb-4">
              Join an existing session using an invite link.
            </p>
            <Link
              href="/join"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
            >
              Join Session
            </Link>
          </div>

          {/* Friends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Friends</h2>
            <p className="text-gray-600 mb-4">
              Manage your friends and friend requests.
            </p>
            <Link
              href="/friends"
              className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
            >
              View Friends
            </Link>
          </div>

          {/* Feed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Artwork Feed</h2>
            <p className="text-gray-600 mb-4">
              Browse and share artwork from the community.
            </p>
            <Link
              href="/feed"
              className="block w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 text-center"
            >
              View Feed
            </Link>
          </div>

          {/* Profile */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>
            <p className="text-gray-600 mb-4">
              View and edit your profile information.
            </p>
            <Link
              href="/profile"
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-center"
            >
              View Profile
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 