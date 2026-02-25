import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import CryptoJS from 'crypto-js';

export default function Home() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState('');
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
    if (!passphrase) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/chat');
      if (res.data.success) {
        const decryptedMessages = res.data.data.map((msg) => {
          // If explicitly marked as not encrypted, use plain content
          if (msg.isEncrypted === false) {
             return { ...msg, text: msg.content };
          }

          try {
            const bytes = CryptoJS.AES.decrypt(msg.content, passphrase);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (!originalText) throw new Error('Decryption failed');
            return { ...msg, text: originalText };
          } catch (e) {
            return { ...msg, text: '[Decryption Error]', error: true };
          }
        });
        setMessages(decryptedMessages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
    setLoading(false);
  };

  // Poll for messages when authenticated
  useEffect(() => {
    if (isAuthenticated && passphrase) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, passphrase]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passphrase.trim()) {
      setIsAuthenticated(true);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !passphrase) return;

    const encrypted = CryptoJS.AES.encrypt(input, passphrase).toString();

    // Optimistic update
    const optimisticMessage = {
      content: encrypted,
      direction: 'outbound',
      timestamp: new Date().toISOString(),
      text: input,
    };
    // Don't add optimistic message to state immediately to avoid dupes on re-fetch,
    // or just rely on fetch. But for responsiveness, add it.
    // Actually, since we re-fetch every 5s and also after send, it might be fine.
    // Ideally we should manage local state better, but this is simple enough.
    setMessages((prev) => [...prev, optimisticMessage]);

    setInput('');

    try {
      await axios.post('/api/chat', {
        content: encrypted,
        direction: 'outbound',
        plainContent: input, // Send plain content for Telegram
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
          <h1 className="text-2xl font-bold mb-6 text-center text-blue-400">Secure Bridge</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Enter Passphrase</label>
              <input
                type="password"
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Your secret key..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition duration-200"
            >
              Unlock Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Head>
        <title>Secure Chat</title>
      </Head>

      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-blue-400">Telegram Bridge</h1>
        <button
          onClick={() => { setIsAuthenticated(false); setPassphrase(''); setMessages([]); }}
          className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded border border-gray-600 hover:border-gray-400"
        >
          Lock
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-500 mt-10">No messages yet. Start a secure conversation.</div>
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
                placeholder="Type a secure message..."
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
