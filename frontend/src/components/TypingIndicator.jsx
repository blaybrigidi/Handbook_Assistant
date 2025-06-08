// src/components/TypingIndicator.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

const TypingIndicator = ({ schoolName = "Handbook" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6 flex justify-start"
    >
      <div className="max-w-2xl">
        <div className="flex items-start space-x-3 mb-2">
          <motion.div 
            className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-full shadow-lg"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <SparklesIcon className="h-4 w-4 text-white" />
          </motion.div>
        </div>

        <motion.div
          className="message-bot rounded-3xl px-6 py-4 shadow-lg"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 font-medium">{schoolName} Assistant is thinking</span>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1.2, 
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
