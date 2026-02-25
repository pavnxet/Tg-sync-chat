import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Home() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Handle URL params for context
  useEffect(() => {
    if (router.isReady) {
      const { title, url } = router.query;
      if (title && url) {
        setInput(`Context: [${title}](${url})\n\n`);
      }
    }
  }, [router.isReady, router.query]);

  // Fetch messages
  const fetchMessages = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/chat');
      if (res.data.success && Array.isArray(res.data.data)) {
        const plainMessages = res.data.data.map((msg) => {
          // Handle potential missing content or legacy data
          const text = msg.content || '[Empty Message]';
          return { ...msg, text: text };
        });
        setMessages(plainMessages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
    setLoading(false);
  };

  // Poll for messages when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      const res = await axios.post('/api/login', { password });
      if (res.data.success) {
        setIsAuthenticated(true);
      }
    } catch (err) {
      alert('Incorrect password');
      console.error('Login failed:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Optimistic update
    const optimisticMessage = {
      content: input,
      direction: 'outbound',
      timestamp: new Date().toISOString(),
      text: input,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const messageToSend = input;
    setInput('');

    try {
      await axios.post('/api/chat', {
        content: messageToSend,
        direction: 'outbound',
      });
      fetchMessages(); // Refresh to confirm and get real ID/timestamp
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <Head>
          <title>Secure Chat Login</title>
        </Head>
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-blue-400">Telegram Bridge</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Enter Password</label>
              <input
                type="password"
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition duration-200"
            >
              Enter Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Head>
        <title>Telegram Chat</title>
      </Head>

      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-blue-400">Telegram Bridge</h1>
        <button
          onClick={() => { setIsAuthenticated(false); setPassword(''); setMessages([]); }}
          className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-600 hover:border-gray-400"
        >
          Logout
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-500 mt-10">No messages yet. Start a conversation.</div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] p-3 rounded-lg shadow-md ${
                msg.direction === 'outbound'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-700 text-gray-200 rounded-bl-none'
              } ${msg.error ? 'border border-red-500' : ''}`}
            >
              <p className="whitespace-pre-wrap break-words text-sm md:text-base">{msg.text}</p>
              <span className="text-xs opacity-70 block text-right mt-1">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
            <textarea
                className="flex-1 p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 resize-none h-14"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                }
                }}
            />
            <button
                type="submit"
                disabled={!input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded transition duration-200 h-14"
            >
                Send
            </button>
            </form>
        </div>
      </footer>
    </div>
  );
}
