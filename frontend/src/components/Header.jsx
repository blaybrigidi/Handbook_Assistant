import React from 'react';
import { motion } from 'framer-motion';
import { AcademicCapIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const Header = ({ onBackToHome }) => {
  return (
    <motion.header 
      className="glass border-b border-gray-200/50 sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {onBackToHome && (
              <motion.button
                onClick={onBackToHome}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              </motion.button>
            )}
            
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl shadow-lg">
                <AcademicCapIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ashesi Assistant</h1>
                <p className="text-sm text-gray-600">Student Handbook Chatbot</p>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            className="flex items-center space-x-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">Online</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
