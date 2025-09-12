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
      // BACKEND API CALLS - FLASK SERVER INTEGRATION
      // ===========================================
      
      // Step 1: Create job and upload video file
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const jobResponse = await fetch('http://localhost:5000/get_job', {
        method: 'POST',
        body: formData,
      });
      
      if (!jobResponse.ok) {
        throw new Error(`Failed to create job: ${jobResponse.statusText}`);
      }
      
      const jobData = await jobResponse.json();
      const jobId = jobData.job_id;
      
      // Step 2: Stream processed frames from distance estimation endpoint
      const streamResponse = await fetch(`http://localhost:5000/distance_estimation/${jobId}`);
      
      if (!streamResponse.ok) {
        throw new Error(`Failed to start processing: ${streamResponse.statusText}`);
      }
      
      // Handle streaming response for processed frames
      const reader = streamResponse.body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert JPEG byte string to blob URL for display
        const jpegBlob = new Blob([value], { type: 'image/jpeg' });
        const frameUrl = URL.createObjectURL(jpegBlob);
        setProcessedFrames(prev => [...prev, frameUrl]);
      }
      
      // Mark processing as complete
      setIsProcessingComplete(true);
      
      // Step 3: Fetch final report with speed limit
      const reportResponse = await fetch(`http://localhost:5000/final_report/${jobId}/speed/${speedLimit}`);
      
      if (!reportResponse.ok) {
        throw new Error(`Failed to get report: ${reportResponse.statusText}`);
      }
      
      const reportData = await reportResponse.json();
      setTrafficReport(reportData.report);
      
      setIsAnalyzing(false);

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

