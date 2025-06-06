import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ChatInterface from './components/ChatInterface';
import Hero from './components/Hero';
import LoadingScreen from './components/LoadingScreen';

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      setInitLoading(true);
      await axios.post(`${API_BASE_URL}/initialize`);
      setIsInitialized(true);
      
      setMessages([{
        id: 1,
        text: "Hello! I'm your Ashesi Student Handbook assistant. I can help you find information about academic policies, student conduct, housing rules, and more. What would you like to know?",
        isBot: true,
        timestamp: new Date(),
        sources: []
      }]);
    } catch (error) {
      console.error('Failed to initialize:', error);
    } finally {
      setInitLoading(false);
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: messageText
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        isBot: true,
        timestamp: new Date(),
        sources: response.data.sources,
        confidence: response.data.confidence
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        isBot: true,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (initLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AnimatePresence mode="wait">
        {!showChat ? (
          <Hero key="hero" onStartChat={() => setShowChat(true)} />
        ) : (
          <ChatInterface
            key="chat"
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            onBackToHome={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
