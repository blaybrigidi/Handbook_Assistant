import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChatBubbleBottomCenterTextIcon, 
  BookOpenIcon, 
  ShieldCheckIcon,
  AcademicCapIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const Hero = ({ onStartChat }) => {
  const features = [
    {
      icon: BookOpenIcon,
      title: "Academic Policies",
      description: "Get instant answers about academic integrity, examination rules, and grading policies.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: ShieldCheckIcon,
      title: "Student Conduct",
      description: "Understand student conduct expectations, disciplinary procedures, and campus safety.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: "Housing & Services",
      description: "Find information about housing policies, university services, and financial procedures.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center px-4 py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto text-center">
        <motion.div variants={itemVariants} className="mb-16">
          <motion.div 
            className="inline-flex items-center space-x-3 mb-8"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-2xl shadow-lg">
              <AcademicCapIcon className="h-8 w-8 text-white" />
            </div>
            <SparklesIcon className="h-6 w-6 text-orange-500 animate-pulse-slow" />
          </motion.div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Your{' '}
            <span className="gradient-text">
              Ashesi
            </span>{' '}
            <br />
            Assistant
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Get instant, accurate answers from the Ashesi Student Handbook. 
            Ask me anything about policies, procedures, and university life.
          </p>

          <motion.button
            onClick={onStartChat}
            className="group relative bg-gradient-to-r from-orange-500 to-red-500 text-white px-12 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center space-x-2">
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
              <span>Start Chatting</span>
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              layoutId="button-bg"
            />
          </motion.button>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={itemVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="glass rounded-3xl p-8 hover:shadow-xl transition-all duration-300 group"
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="h-8 w-8 text-white" />
              </motion.div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              
              <motion.div
                className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="mt-16 flex justify-center space-x-2"
          variants={itemVariants}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Hero;
