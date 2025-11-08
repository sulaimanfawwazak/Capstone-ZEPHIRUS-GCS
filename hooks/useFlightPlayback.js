// hooks/useFlightPlayback.js
import { useState, useRef, useCallback, useEffect } from 'react';

export function useFlightPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackData, setPlaybackData] = useState([]);
  const [duration, setDuration] = useState(0);
  const playbackIntervalRef = useRef(null);
  const startTimeRef = useRef(0);

  // Load recording data
  const loadRecording = useCallback((data) => {
    if (!data || data.length === 0) {
      // Clear everything when empty array is passed
      setPlaybackData([]);
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
      return;
    }    
    
    setPlaybackData(data);
    setDuration(data[data.length - 1]?.recordingTimestamp || 0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  // Start playback
  const startPlayback = useCallback(() => {
    if (playbackData.length === 0) return;
    
    setIsPlaying(true);
    startTimeRef.current = Date.now() - (currentTime / playbackSpeed);
    
    playbackIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) * playbackSpeed;
      setCurrentTime(Math.min(elapsed, duration));
      
      if (elapsed >= duration) {
        stopPlayback();
      }
    }, 16); // ~60fps
  }, [playbackData, currentTime, playbackSpeed, duration]);

  // Pause playback
  const pausePlayback = useCallback(() => {
    setIsPlaying(false);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  // Stop playback
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  const stopAndClearPlayback = useCallback(() => {
    stopPlayback();
    setPlaybackData([]);
    setCurrentTime(0);
    setDuration(0);
  }, [stopPlayback]);

  // Seek to specific time
  const seekTo = useCallback((time) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
    if (isPlaying) {
      pausePlayback();
      startPlayback();
    }
  }, [isPlaying, duration, pausePlayback, startPlayback]);

  // Get current frame data
  const getCurrentFrame = useCallback(() => {
    if (playbackData.length === 0) return null;
    
    // Find the data point closest to current time
    const currentFrame = playbackData.find((point, index) => {
      const nextPoint = playbackData[index + 1];
      return point.recordingTimestamp <= currentTime && 
              (!nextPoint || nextPoint.recordingTimestamp > currentTime);
    });
    
    return currentFrame || playbackData[playbackData.length - 1];
  }, [playbackData, currentTime]);

  // Get playback progress (0-1)
  const progress = duration > 0 ? currentTime / duration : 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    isPlaying,
    playbackSpeed,
    currentTime,
    playbackData,
    duration,
    progress,
    
    // Controls
    loadRecording,
    startPlayback,
    pausePlayback,
    stopPlayback,
    stopAndClearPlayback,
    seekTo,
    setPlaybackSpeed,
    
    // Data
    getCurrentFrame,
    hasRecording: playbackData.length > 0,
    
    // Metadata
    frameCount: playbackData.length,
    currentFrameIndex: playbackData.findIndex(point => 
      point.recordingTimestamp <= currentTime && 
      (!playbackData[playbackData.findIndex(p => p === point) + 1] || 
       playbackData[playbackData.findIndex(p => p === point) + 1].recordingTimestamp > currentTime)
    )
  };
}