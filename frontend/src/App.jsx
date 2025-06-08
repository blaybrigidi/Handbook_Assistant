import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Hero from './components/Hero';
import SchoolSelector from './components/SchoolSelector';
import HandbookUploader from './components/HandbookUploader';
import ChatInterface from './components/ChatInterface';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function App() {
  const [currentStep, setCurrentStep] = useState('hero'); // hero, school-selector, handbook-uploader, chat
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartJourney = () => {
    setCurrentStep('school-selector');
  };

  const handleSchoolSelected = (school) => {
    setSelectedSchool(school);
    // Initialize chat with welcome message for the school
    const welcomeMessage = {
      id: 1,
      text: `Hello! I'm your ${school.school_name} Student Handbook assistant. I can help you find information about academic policies, student conduct, housing rules, and more. What would you like to know?`,
      isBot: true,
      timestamp: new Date(),
      sources: []
    };
    setMessages([welcomeMessage]);
    setCurrentStep('chat');
  };

  const handleSchoolNotFound = () => {
    setCurrentStep('handbook-uploader');
  };

  const handleHandbookUploaded = (result) => {
    // Set the school from the upload result
    const school = {
      school_id: result.school_id,
      school_name: result.school_name
    };
    setSelectedSchool(school);
    
    // Initialize chat with welcome message
    const welcomeMessage = {
      id: 1,
      text: `Welcome! I've successfully processed your ${school.school_name} handbook. I can now help you find information about academic policies, student conduct, and more. What would you like to know?`,
      isBot: true,
      timestamp: new Date(),
      sources: []
    };
    setMessages([welcomeMessage]);
    setCurrentStep('chat');
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !selectedSchool) return;

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
        message: messageText,
        school_id: selectedSchool.school_id
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        isBot: true,
        timestamp: new Date(),
        sources: [],
        confidence: 0.9
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

  const handleBackToSchoolSelector = () => {
    setSelectedSchool(null);
    setMessages([]);
    setCurrentStep('school-selector');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AnimatePresence mode="wait">
        {currentStep === 'hero' && (
          <Hero key="hero" onStartJourney={handleStartJourney} />
        )}
        
        {currentStep === 'school-selector' && (
          <SchoolSelector 
            key="school-selector"
            onSchoolSelected={handleSchoolSelected}
            onSchoolNotFound={handleSchoolNotFound}
            onBack={() => setCurrentStep('hero')}
          />
        )}
        
        {currentStep === 'handbook-uploader' && (
          <HandbookUploader 
            key="handbook-uploader"
            onHandbookUploaded={handleHandbookUploaded}
            onBack={() => setCurrentStep('school-selector')}
          />
        )}
        
        {currentStep === 'chat' && selectedSchool && (
          <ChatInterface
            key="chat"
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={isLoading}
            selectedSchool={selectedSchool}
            onBackToSchoolSelector={handleBackToSchoolSelector}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
