import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

// Import the Zustand store and its types
import { useMeetingStore } from '../store/useMeetingStore.tsx';
import type { ChatMessage } from '../store/useMeetingStore.tsx';

function ChatBox() {
  const [newMessage, setNewMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null); // Specify HTMLDivElement type

  // Get state and actions from the Zustand store
  const { messages, userName, socket, meetingId, sendChatMessage } = useMeetingStore((state: { chatMessages: any; userName: any; socket: any; meetingId: any; sendChatMessage: any; }) => ({
    messages: state.chatMessages, // Renamed from chatMessages to messages for prop consistency
    userName: state.userName,
    socket: state.socket,
    meetingId: state.meetingId,
    sendChatMessage: state.sendChatMessage, // Action to send message
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // Call the sendChatMessage action from the store
      sendChatMessage(newMessage.trim());
      setNewMessage(''); // Clear the input field
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xl font-semibold text-blue-300">Meeting Chat</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center mt-4">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg: ChatMessage, index: number) => ( // Explicitly type msg
            <div
              key={index}
              className={`mb-3 p-3 rounded-lg max-w-[80%] ${
                msg.senderId === socket?.id
                  ? 'bg-blue-700 text-white self-end ml-auto'
                  : 'bg-gray-700 text-gray-100 self-start mr-auto'
              }`}
            >
              <div className="font-semibold text-sm mb-1">
                {msg.senderId === socket?.id ? 'You' : msg.userName}
                <span className="text-xs text-gray-300 ml-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-base break-words">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex items-center">
        <input
          type="text"
          className="flex-1 p-3 rounded-l-md bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-md transition duration-300 ease-in-out flex items-center justify-center shadow-md"
          title="Send message"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
