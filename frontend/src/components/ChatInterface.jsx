import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon, 
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import Header from './Header';

const ChatInterface = ({ messages, onSendMessage, isLoading, onBackToHome }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const quickQuestions = [
    "What is the academic integrity policy?",
    "What are the rules about violence?",
    "Can I have guests in my room?",
    "What happens if I plagiarize?",
    "How do I appeal a decision?"
  ];

  return (
    <motion.div 
      className="min-h-screen flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <Header onBackToHome={onBackToHome} />

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 chat-container">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </AnimatePresence>
          
          {isLoading && <TypingIndicator />}
          
          {/* Quick Questions */}
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <div className="text-center mb-6">
                <SparklesIcon className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Try asking:</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {quickQuestions.map((question, index) => (
                  <motion.button
                    key={index}
                    onClick={() => onSendMessage(question)}
                    className="glass rounded-2xl px-4 py-3 text-sm text-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-200/50"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    {question}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="glass border-t border-gray-200/50 p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me about Ashesi policies..."
                className="w-full border border-gray-300 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-500 shadow-sm"
                disabled={isLoading}
              />
              {inputValue && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-20 top-1/2 transform -translate-y-1/2"
                >
                  <SparklesIcon className="h-5 w-5 text-orange-500" />
                </motion.div>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PaperAirplaneIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatInterface;
