import React from 'react';
import './SpeedLimitInput.css';

/**
 * SpeedLimitInput Component
 * Provides an input field for users to enter the speed limit
 * Validates that the input is a positive number
 */
const SpeedLimitInput = ({ value, onChange }) => {
  // Handle input change with validation
  const handleChange = (event) => {
    const inputValue = event.target.value;
    // Allow only numbers and decimal point
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  return (
    <div className="speed-limit-container">
      <h3>Speed Limit</h3>
      <div className="input-group">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Enter speed limit (km/h)"
          className="speed-limit-input"
        />
        <span className="input-unit">km/h</span>
      </div>
      <p className="input-hint">
        Enter the speed limit for the road in the video
      </p>
    </div>
  );
};

export default SpeedLimitInput;

