import React from 'react';
import './AnalysisButton.css';

/**
 * AnalysisButton Component
 * Triggers the video analysis process
 * Shows loading state during analysis
 */
const AnalysisButton = ({ onClick, disabled, isAnalyzing }) => {
  return (
    <div className="analysis-button-container">
      <button
        className={`analysis-button ${isAnalyzing ? 'analyzing' : ''}`}
        onClick={onClick}
        disabled={disabled || isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <div className="spinner"></div>
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <span className="button-icon">🚀</span>
            <span>Run Analysis</span>
          </>
        )}
      </button>
      {isAnalyzing && (
        <p className="analysis-status">
          Processing video frames... This may take a few minutes.
        </p>
      )}
    </div>
  );
};

export default AnalysisButton;

