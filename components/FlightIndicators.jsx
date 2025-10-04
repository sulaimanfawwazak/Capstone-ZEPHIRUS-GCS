// components/FlightIndicators.jsx
"use client"
import { useEffect, useState } from "react";

// Create a custom hook to dynamically import and patch the library
function usePatchedFlightIndicators() {
  const [Components, setComponents] = useState(null);

  useEffect(() => {
    const loadAndPatch = async () => {
      try {
        // Dynamically import the library
        const module = await import('react-flight-indicators');
        
        // Create patched versions of the components
        const createPatchedComponent = (OriginalComponent) => {
          return function PatchedComponent(props) {
            // We'll render the original component but it might still fail
            return <OriginalComponent {...props} />;
          };
        };

        setComponents({
          AttitudeIndicator: createPatchedComponent(module.AttitudeIndicator),
          HeadingIndicator: createPatchedComponent(module.HeadingIndicator)
        });
      } catch (error) {
        console.error('Failed to load flight indicators:', error);
      }
    };

    loadAndPatch();
  }, []);

  return Components;
}

export default function FlightIndicators({ roll = 0, pitch = 0, heading = 0 }) {
  const Components = usePatchedFlightIndicators();

  if (!Components) {
    return <div className="p-4 text-center">Loading Indicators...</div>;
  }

  const { AttitudeIndicator, HeadingIndicator } = Components;

  return (
    <div className="flex items-center justify-center px-4 gap-x-2">
      <div>
        <AttitudeIndicator
          roll={roll}
          pitch={pitch}
          showBox={false}
          size={180}
        />
      </div>
      <div>
        <HeadingIndicator
          heading={heading}
          showBox={false}
          size={180}
        />
      </div>
    </div>
  );
}