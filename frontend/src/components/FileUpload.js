import React, { useRef } from 'react';
import './FileUpload.css';

/**
 * FileUpload Component
 * Handles video file selection and upload functionality
 * Supports drag and drop as well as click to select
 */
const FileUpload = ({ onFileUpload }) => {
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      onFileUpload(file);
    } else {
      alert('Please select a valid video file');
    }
  };

  // Handle drag and drop
  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      onFileUpload(file);
    } else {
      alert('Please drop a valid video file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Handle click to open file dialog
  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-upload-container">
      <h3>Upload Video File</h3>
      <div 
        className="file-upload-area"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="upload-icon">📹</div>
        <p className="upload-text">
          Click to select or drag and drop your video file here
        </p>
        <p className="upload-hint">
          Supported formats: MP4, AVI, MOV, WMV, etc.
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileUpload;

