import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon,
  DocumentIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const HandbookUploader = ({ onHandbookUploaded, onBack }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [schoolAbbr, setSchoolAbbr] = useState('');
  const [handbookTitle, setHandbookTitle] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError('');
        
        // Auto-fill handbook title from filename
        const fileName = droppedFile.name.replace('.pdf', '');
        if (!handbookTitle) {
          setHandbookTitle(fileName);
        }
      } else {
        setError('Please upload a PDF file only.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError('');
        
        // Auto-fill handbook title from filename
        const fileName = selectedFile.name.replace('.pdf', '');
        if (!handbookTitle) {
          setHandbookTitle(fileName);
        }
      } else {
        setError('Please upload a PDF file only.');
      }
    }
  };

  const pollProgress = async (jobId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/processing-status/${jobId}`);
      const status = response.data;
      
      setUploadProgress(status.progress);
      setUploadStatus(status.message);
      
      if (status.status === 'completed') {
        setTimeout(() => {
          onHandbookUploaded({
            school_id: status.result.handbook_id.split('_')[0],
            school_name: schoolName,
            ...status.result
          });
        }, 1000);
      } else if (status.status === 'error') {
        setError(status.message);
        setIsUploading(false);
      } else if (status.status === 'processing') {
        setTimeout(() => pollProgress(jobId), 2000);
      }
    } catch (error) {
      console.error('Error polling progress:', error);
      setTimeout(() => pollProgress(jobId), 5000);
    }
  };

  const handleUpload = async () => {
    if (!file || !schoolName.trim() || !handbookTitle.trim() || !academicYear.trim()) {
      setError('Please fill in all required fields and select a PDF file.');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    try {
      // First, add the school
      const schoolResponse = await axios.post(`${API_BASE_URL}/add-school`, {
        school_name: schoolName,
        school_abbreviation: schoolAbbr
      });

      const schoolId = schoolResponse.data.school_id;

      // Then upload the handbook
      const formData = new FormData();
      formData.append('file', file);
      formData.append('school_id', schoolId);
      formData.append('handbook_title', handbookTitle);
      formData.append('academic_year', academicYear);

      const uploadResponse = await axios.post(`${API_BASE_URL}/process-handbook`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const jobId = uploadResponse.data.job_id;
      
      // Start polling for progress
      pollProgress(jobId);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.detail || 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

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
            <span>Back to Search</span>
          </motion.button>

          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-2xl">
              <BookOpenIcon className="h-8 w-8 text-white" />
            </div>
            <SparklesIcon className="h-6 w-6 text-orange-500 animate-pulse" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Upload Your{' '}
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Handbook
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Add your school's handbook to our database so other students can benefit too!
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* School Information Form */}
          <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">School Information</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  School Name *
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g., Harvard University"
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 focus:outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  School Abbreviation (Optional)
                </label>
                <input
                  type="text"
                  value={schoolAbbr}
                  onChange={(e) => setSchoolAbbr(e.target.value)}
                  placeholder="e.g., Harvard, HU"
                  className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Handbook Title *
                  </label>
                  <input
                    type="text"
                    value={handbookTitle}
                    onChange={(e) => setHandbookTitle(e.target.value)}
                    placeholder="e.g., Student Handbook"
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 focus:outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder={`e.g., ${currentYear}-${nextYear}`}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* File Upload Area */}
          <motion.div variants={itemVariants}>
            <div
              className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-orange-500 bg-orange-50/50' 
                  : file 
                    ? 'border-green-500 bg-green-50/50'
                    : 'border-gray-300 bg-white/50 hover:border-orange-400 hover:bg-orange-50/30'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div
                    key="file-selected"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="space-y-4"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <DocumentIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
                      <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">File ready for upload</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="file-prompt"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="space-y-4"
                  >
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                      <CloudArrowUpIcon className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Upload PDF Handbook</h3>
                      <p className="text-gray-600">Drag and drop your PDF file here, or click to browse</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 font-medium">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Progress */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Processing Your Handbook</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{uploadStatus}</span>
                    <span className="text-sm font-bold text-orange-600">{uploadProgress}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Button */}
          <motion.div variants={itemVariants} className="mt-8 text-center">
            <motion.button
              onClick={handleUpload}
              disabled={!file || !schoolName.trim() || !handbookTitle.trim() || !academicYear.trim() || isUploading}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-12 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {isUploading ? (
                <span className="flex items-center space-x-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Processing...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <CloudArrowUpIcon className="h-5 w-5" />
                  <span>Upload & Process Handbook</span>
                </span>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HandbookUploader; 