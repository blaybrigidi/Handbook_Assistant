import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  ArrowLeftIcon,
  PlusIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  BookOpenIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const SchoolSelector = ({ onSchoolSelected, onSchoolNotFound, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);

  const searchSchools = useCallback(async () => {
    setIsSearching(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/search-schools`, {
        query: searchQuery
      });
      setSchools(response.data.schools);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching schools:', error);
      setSchools([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const delayedSearch = setTimeout(() => {
        searchSchools();
      }, 300);
      return () => clearTimeout(delayedSearch);
    } else {
      setSchools([]);
      setHasSearched(false);
    }
  }, [searchQuery, searchSchools]);

  const handleSchoolClick = (school) => {
    setSelectedSchool(school);
    setTimeout(() => {
      onSchoolSelected(school);
    }, 500);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.4 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <motion.button
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200"
            whileHover={{ x: -5 }}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </motion.button>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your{' '}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              School
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Search for your university or college to access your student handbook assistant
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type your school name (e.g., Harvard University, MIT, Stanford...)"
              className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm focus:border-orange-500 focus:ring-0 focus:outline-none transition-all duration-200 shadow-lg"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <motion.div
                  className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Search Results */}
        <AnimatePresence>
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              {schools.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Found {schools.length} school{schools.length !== 1 ? 's' : ''}
                  </h3>
                  {schools.map((school, index) => (
                    <motion.div
                      key={school.school_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSchoolClick(school)}
                      className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer hover:shadow-xl ${
                        selectedSchool?.school_id === school.school_id
                          ? 'border-green-500 bg-green-50/80'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedSchool?.school_id === school.school_id
                            ? 'bg-green-500'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 group-hover:scale-110'
                        }`}>
                          {selectedSchool?.school_id === school.school_id ? (
                            <CheckCircleIcon className="h-6 w-6 text-white" />
                          ) : (
                            <AcademicCapIcon className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{school.school_name}</h3>
                          {school.school_abbreviation && (
                            <p className="text-sm text-gray-600">{school.school_abbreviation}</p>
                          )}
                        </div>
                        <motion.div
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          whileHover={{ scale: 1.1 }}
                        >
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpenIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">
                    No schools found for "{searchQuery}"
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    We couldn't find any schools matching your search. Would you like to add your school to our database?
                  </p>
                  
                  {/* Can't Find Your School Section - Only shows when no results */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-3xl p-6 max-w-md mx-auto mb-6"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
                          <CloudArrowUpIcon className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Can't find your school?</h4>
                      </div>
                      <p className="text-gray-600 mb-4 text-sm">
                        Upload your handbook and we'll add your school to help other students too!
                      </p>
                    </div>
                  </motion.div>

                  <motion.button
                    onClick={onSchoolNotFound}
                    className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    <span className="flex items-center space-x-2">
                      <PlusIcon className="h-5 w-5" />
                      <span>Upload Your Handbook</span>
                    </span>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State - When no search has been performed */}
        {!hasSearched && searchQuery.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MagnifyingGlassIcon className="h-10 w-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Start typing to search
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Enter at least 3 characters to search for your school
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SchoolSelector; 