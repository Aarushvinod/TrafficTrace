import React, { forwardRef, useState } from 'react';

/**
 * SimpleVideoPlayer Component
 * A minimal video player without custom styling to test basic functionality
 */
const SimpleVideoPlayer = forwardRef(({ src, controls = true }, ref) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (e) => {
    console.error('Video error:', e);
    const error = e.target.error;
    let errorMessage = 'Video failed to load. ';
    
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage += 'Loading aborted.';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage += 'Network error.';
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage += 'Format not supported or corrupted.';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage += 'Format not supported by browser.';
          break;
        default:
          errorMessage += 'Unknown error.';
      }
    }
    
    setError(errorMessage);
    setIsLoading(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  return (
    <div style={{ width: '100%', backgroundColor: '#000', padding: '1rem', borderRadius: '10px', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          textAlign: 'center',
          zIndex: 10
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading video...</p>
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          textAlign: 'center',
          zIndex: 10,
          backgroundColor: 'rgba(255,0,0,0.8)',
          padding: '1rem',
          borderRadius: '10px'
        }}>
          <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>⚠️</div>
          <p>{error}</p>
        </div>
      )}

      <video
        ref={ref}
        src={src}
        controls={controls}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: '400px',
          backgroundColor: '#000',
          display: error ? 'none' : 'block'
        }}
        preload="metadata"
        onError={handleError}
        onCanPlay={handleCanPlay}
        onLoadStart={handleLoadStart}
      >
        Your browser does not support the video tag.
      </video>
      
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

SimpleVideoPlayer.displayName = 'SimpleVideoPlayer';

export default SimpleVideoPlayer;
