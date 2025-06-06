// src/components/LoadingScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-3xl shadow-xl mb-8 mx-auto w-20 h-20 flex items-center justify-center"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity }
          }}
        >
          <AcademicCapIcon className="h-10 w-10 text-white" />
        </motion.div>
        
        <motion.h2 
          className="text-2xl font-bold text-gray-900 mb-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Initializing Ashesi Assistant
        </motion.h2>
        
        <motion.div className="flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1.2, 
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
        
        <p className="text-gray-600 mt-4">Loading your handbook data...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
