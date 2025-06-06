import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  UserIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const MessageBubble = ({ message }) => {
  const [showSources, setShowSources] = useState(false);

  const bubbleVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    }
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={`mb-6 flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-2xl ${message.isBot ? '' : 'order-1'}`}>
        <div className="flex items-start space-x-3 mb-2">
          {message.isBot && (
            <motion.div 
              className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-full shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <SparklesIcon className="h-4 w-4 text-white" />
            </motion.div>
          )}
          
          {!message.isBot && (
            <motion.div 
              className="bg-gray-600 p-2 rounded-full shadow-lg order-2"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <UserIcon className="h-4 w-4 text-white" />
            </motion.div>
          )}
        </div>

        <motion.div
          className={`rounded-3xl px-6 py-4 shadow-lg ${
            message.isBot
              ? message.isError
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'message-bot text-gray-800'
              : 'message-user text-white'
          }`}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.text}
          </div>
          
          {message.isBot && message.confidence && (
            <motion.div 
              className="mt-4 flex items-center space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-600 font-medium">
                  {Math.round(message.confidence * 100)}% confident
                </span>
              </div>
              <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${message.confidence * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-4">
            <motion.button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors group"
              whileHover={{ x: 5 }}
            >
              <DocumentTextIcon className="h-4 w-4 group-hover:text-orange-500 transition-colors" />
              <span className="font-medium">Sources ({message.sources.length})</span>
              <ChevronDownIcon 
                className={`h-4 w-4 transition-transform duration-200 ${showSources ? 'rotate-180' : ''}`} 
              />
            </motion.button>

            <AnimatePresence>
              {showSources && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-3 overflow-hidden"
                >
                  {message.sources.slice(0, 3).map((source, index) => (
                    <motion.div
                      key={index}
                      className="glass rounded-2xl p-4 border border-gray-200/50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {source.title}
                        </h4>
                        <span className="text-xs text-white bg-gradient-to-r from-green-400 to-green-500 px-2 py-1 rounded-full font-medium shadow-sm">
                          {Math.round(source.similarity * 100)}% match
                        </span>
                      </div>
                      <p className="text-xs text-orange-600 font-medium mb-2 bg-orange-50 px-2 py-1 rounded-lg inline-block">
                        {source.category}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {source.summary?.substring(0, 150) || source.content?.substring(0, 150)}
                        {(source.summary?.length > 150 || source.content?.length > 150) && '...'}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <motion.div 
          className={`mt-3 text-xs text-gray-500 ${message.isBot ? 'text-left' : 'text-right'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
