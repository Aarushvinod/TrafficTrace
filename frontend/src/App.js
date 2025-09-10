import React, { useState, useRef, useCallback } from 'react';
import './App.css';
import SimpleVideoPlayer from './components/SimpleVideoPlayer';
import FileUpload from './components/FileUpload';
import SpeedLimitInput from './components/SpeedLimitInput';
import AnalysisButton from './components/AnalysisButton';
import ProcessedVideoDisplay from './components/ProcessedVideoDisplay';
import TrafficReport from './components/TrafficReport';

function App() {
  // State management for the application
  const [uploadedFile, setUploadedFile] = useState(null);
  const [speedLimit, setSpeedLimit] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processedFrames, setProcessedFrames] = useState([]);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [trafficReport, setTrafficReport] = useState('');
  const [videoUrl, setVideoUrl] = useState(null);

  // Refs for video elements
  const originalVideoRef = useRef(null);
  const processedVideoRef = useRef(null);

  // Handle file upload
  const handleFileUpload = useCallback((file) => {
    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'];
    if (!validTypes.includes(file.type)) {
      alert(`Unsupported file type: ${file.type}. Please use MP4, WebM, OGG, AVI, MOV, or WMV files.`);
      return;
    }
    
    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert('File too large. Please use a video file smaller than 100MB.');
      return;
    }
    
    setUploadedFile(file);
    
    try {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } catch (error) {
      console.error('Error creating video URL:', error);
      alert('Error processing video file. Please try a different file.');
      return;
    }
    
    // Reset processing state when new file is uploaded
    setIsProcessingComplete(false);
    setProcessedFrames([]);
    setTrafficReport('');
  }, []);

  // Handle speed limit change
  const handleSpeedLimitChange = useCallback((value) => {
    setSpeedLimit(value);
  }, []);

  // Handle analysis button click
  const handleRunAnalysis = useCallback(async () => {
    if (!uploadedFile || !speedLimit) {
      alert('Please upload a video file and enter a speed limit');
      return;
    }

    setIsAnalyzing(true);
    setProcessedFrames([]);
    setIsProcessingComplete(false);
    setTrafficReport('');

    try {
      // ===========================================
      // BACKEND API CALLS - PLACE YOUR LOGIC HERE
      // ===========================================
      
      // TODO: Replace this section with your actual backend API calls
      // 1. Stream video frames to your Flask server
      // 2. Receive processed frames as JPEG byte strings
      // 3. Display frames in real-time
      // 4. After processing is complete, fetch the traffic report
      
      // Example structure for your API calls:
      /*
      const formData = new FormData();
      formData.append('video', uploadedFile);
      formData.append('speedLimit', speedLimit);

      // Start streaming frames to backend
      const response = await fetch('http://your-flask-server:port/analyze-video', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Handle streaming response
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Process received frame data
        const frameData = new Uint8Array(value);
        setProcessedFrames(prev => [...prev, frameData]);
      }

      // After processing is complete, fetch the report
      const reportResponse = await fetch('http://your-flask-server:port/get-report');
      const reportData = await reportResponse.json();
      setTrafficReport(reportData.report);
      */
      
      // Temporary simulation - REMOVE THIS WHEN IMPLEMENTING REAL API CALLS
      setTimeout(() => {
        setIsProcessingComplete(true);
        setTrafficReport('Sample traffic analysis report will appear here after processing...');
        setIsAnalyzing(false);
      }, 3000);

    } catch (error) {
      console.error('Error during analysis:', error);
      alert('Error occurred during analysis. Please try again.');
      setIsAnalyzing(false);
    }
  }, [uploadedFile, speedLimit]);

  return (
    <div className="App">
      <header className="app-header">
        <h1 className="app-title">TrafficTrace: Quantitative Traffic Analysis</h1>
      </header>

      <main className="app-main">
        <div className="upload-section">
          <FileUpload onFileUpload={handleFileUpload} />
          <SpeedLimitInput 
            value={speedLimit} 
            onChange={handleSpeedLimitChange} 
          />
          <AnalysisButton 
            onClick={handleRunAnalysis}
            disabled={!uploadedFile || !speedLimit || isAnalyzing}
            isAnalyzing={isAnalyzing}
          />
        </div>

        <div className="video-section">
          {videoUrl && (
            <div className="original-video-container">
              <h2>Original Video</h2>
              <SimpleVideoPlayer 
                ref={originalVideoRef}
                src={videoUrl}
                controls={true}
              />
            </div>
          )}

          {(isAnalyzing || isProcessingComplete) && (
            <div className="processed-video-container">
              <h2>Processed Video Analysis</h2>
              <ProcessedVideoDisplay 
                ref={processedVideoRef}
                frames={processedFrames}
                isProcessing={isAnalyzing}
                isComplete={isProcessingComplete}
              />
            </div>
          )}
        </div>

        {trafficReport && (
          <div className="report-section">
            <TrafficReport content={trafficReport} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

