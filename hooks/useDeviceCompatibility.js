// hooks/useDeviceCompatibility.js
import { useState, useEffect } from 'react';

export function useDeviceCompatibility() {
  const [isCompatible, setIsCompatible] = useState(true);
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    orientation: 'landscape'
  });

  useEffect(() => {
    const checkCompatibility = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'landscape' : 'portrait';
      
      setScreenInfo({
        width,
        height,
        orientation
      });

      // Define compatibility rules
      const isWidthCompatible = width >= 1000; // Minimum 1024px width (tablet landscape)
      const isHeightCompatible = height >= 480; // Minimum 768px height
      const isOrientationCompatible = orientation === 'landscape';
      
      // Device is compatible if it meets all criteria
      const compatible = isWidthCompatible && isHeightCompatible && isOrientationCompatible;
      setIsCompatible(compatible);
    };

    // Check initially
    checkCompatibility();

    // Add event listener for window resize
    window.addEventListener('resize', checkCompatibility);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkCompatibility);
  }, []);

  return {
    isCompatible,
    screenInfo,
    minWidth: 1000,
    minHeight: 480
  };
}