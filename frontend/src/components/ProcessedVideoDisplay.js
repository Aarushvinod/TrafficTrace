import React, { forwardRef, useState, useEffect } from 'react';
import './ProcessedVideoDisplay.css';

/**
 * ProcessedVideoDisplay Component
 * Displays processed video frames received from the backend
 * Shows frames in real-time during processing and allows playback after completion
 */
const ProcessedVideoDisplay = forwardRef(({ frames, isProcessing, isComplete }, ref) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Auto-play frames during processing
  useEffect(() => {
    if (isProcessing && frames.length > 0) {
      const interval = setInterval(() => {
        setCurrentFrameIndex(frames.length - 1); // Always show the latest frame
      }, 100); // Update every 100ms for smooth real-time display
      return () => clearInterval(interval);
    }
  }, [isProcessing, frames]);

  // Playback functionality after processing is complete
  useEffect(() => {
    if (isComplete && isPlaying && frames.length > 0) {
      const interval = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      }, 1000 / playbackSpeed); // Adjust playback speed
      return () => clearInterval(interval);
    }
  }, [isComplete, isPlaying, frames.length, playbackSpeed]);

  // Convert frame data to displayable image
  const getCurrentFrame = () => {
    if (frames.length === 0) return null;
    const frameData = frames[currentFrameIndex];
    if (frameData instanceof Uint8Array) {
      const blob = new Blob([frameData], { type: 'image/jpeg' });
      return URL.createObjectURL(blob);
    }
    return frameData; // Assume it's already a URL or base64 string
  };

  const handlePlay = () => {
    if (isComplete) {
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleRewind = () => {
    setCurrentFrameIndex(prev => Math.max(0, prev - 10));
  };

  const handleForward = () => {
    setCurrentFrameIndex(prev => Math.min(frames.length - 1, prev + 10));
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
  };

  const currentFrameUrl = getCurrentFrame();

  return (
    <div className="processed-video-display">
      <div className="frame-container">
        {currentFrameUrl ? (
          <img
            ref={ref}
            src={currentFrameUrl}
            alt={`Processed frame ${currentFrameIndex + 1}`}
            className="processed-frame"
          />
        ) : (
          <div className="no-frames-placeholder">
            <div className="placeholder-icon">🎬</div>
            <p>Waiting for processed frames...</p>
          </div>
        )}
        
        {isProcessing && (
          <div className="processing-overlay">
            <div className="processing-spinner"></div>
            <p>Processing frame {frames.length}...</p>
          </div>
        )}
      </div>

      {isComplete && frames.length > 0 && (
        <div className="playback-controls">
          <div className="control-buttons">
            <button onClick={handleRewind} className="control-btn">
              ⏪ Rewind
            </button>
            <button 
              onClick={isPlaying ? handlePause : handlePlay} 
              className="control-btn play-btn"
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button onClick={handleForward} className="control-btn">
              ⏩ Forward
            </button>
          </div>
          
          <div className="speed-controls">
            <label>Speed:</label>
            <select 
              value={playbackSpeed} 
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="speed-select"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>

          <div className="frame-info">
            Frame {currentFrameIndex + 1} of {frames.length}
          </div>
        </div>
      )}
    </div>
  );
});

ProcessedVideoDisplay.displayName = 'ProcessedVideoDisplay';

export default ProcessedVideoDisplay;

