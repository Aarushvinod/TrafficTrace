import React from 'react';
import './TrafficReport.css';

/**
 * TrafficReport Component
 * Displays the final traffic analysis report received from the backend
 * Provides a clean, readable format for the analysis results
 */
const TrafficReport = ({ content }) => {
  // Format the report content for better readability
  const formatReportContent = (text) => {
    if (!text) return '';
    
    // Split by common report sections
    const sections = text.split(/\n\s*\n/);
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return null;
      
      // Check if this looks like a header (all caps or starts with specific keywords)
      const isHeader = /^[A-Z\s]+:$/.test(trimmedSection) || 
                      /^(SUMMARY|ANALYSIS|STATISTICS|RECOMMENDATIONS|CONCLUSION)/i.test(trimmedSection);
      
      if (isHeader) {
        return (
          <h3 key={index} className="report-section-header">
            {trimmedSection.replace(/:$/, '')}
          </h3>
        );
      }
      
      // Check if this looks like a bullet point or list item
      if (/^[-•*]\s/.test(trimmedSection) || /^\d+\.\s/.test(trimmedSection)) {
        return (
          <li key={index} className="report-list-item">
            {trimmedSection.replace(/^[-•*]\s/, '• ').replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="report-paragraph">
          {trimmedSection}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="traffic-report">
      <div className="report-header">
        <h2>Traffic Analysis Report</h2>
        <div className="report-icon">📊</div>
      </div>
      
      <div className="report-content">
        {content ? (
          <div className="formatted-report">
            {formatReportContent(content)}
          </div>
        ) : (
          <div className="no-report-placeholder">
            <p>Traffic analysis report will appear here after processing is complete.</p>
          </div>
        )}
      </div>
      
      {content && (
        <div className="report-footer">
          <p className="report-timestamp">
            Report generated on {new Date().toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrafficReport;

