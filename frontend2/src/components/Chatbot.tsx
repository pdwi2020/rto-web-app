import React, { useState } from 'react';

interface ChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Chatbot = ({ isOpen = false, onClose }: ChatbotProps) => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      setResponse('Error: Unable to connect to chatbot service.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white/90 backdrop-blur-lg rounded-2xl border border-white/40 shadow-2xl z-50 flex flex-col">
      <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl flex justify-between items-center">
        <h3 className="font-semibold">AI Assistant</h3>
        <button onClick={onClose} className="text-white hover:text-gray-200">×</button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {response && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">{response}</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about RTO services..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
