// hooks/useFlightAnalysis.js
import { useState, useCallback } from 'react';

export function useFlightAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeFlightConditions = useCallback(async (weatherData, flightData) => {
    if (!weatherData) return;
    
    setLoading(true);
    setError(null);

    try {
      // For now, we'll create a local analysis since Gemini API requires API keys
      // You can replace this with actual Gemini API call later
      
      const { windSpeed, rain, temperature, humidity } = weatherData;
      
      let analysisText = "";
      
      // Wind analysis
      if (windSpeed > 15) {
        analysisText += "❌ High winds detected. Consider postponing flight. ";
      } else if (windSpeed > 10) {
        analysisText += "⚠️ Moderate winds. Fly with caution. ";
      } else {
        analysisText += "✅ Favorable wind conditions. ";
      }
      
      // Rain analysis
      if (rain > 5) {
        analysisText += "❌ Heavy rain. Unsafe for flight. ";
      } else if (rain > 2) {
        analysisText += "⚠️ Light rain. Waterproof equipment recommended. ";
      } else {
        analysisText += "✅ No significant precipitation. ";
      }
      
      // Temperature analysis
      if (temperature > 35) {
        analysisText += "⚠️ High temperature may affect battery performance. ";
      } else if (temperature < 0) {
        analysisText += "⚠️ Low temperature may affect battery and sensors. ";
      }
      
      // Humidity analysis
      if (humidity > 80) {
        analysisText += "⚠️ High humidity may cause condensation on sensors. ";
      }
      
      if (!analysisText) {
        analysisText = "✅ Optimal flight conditions detected. Safe to fly.";
      }
      
      setAnalysis(analysisText);
      
    } catch (err) {
      setError('Failed to analyze flight conditions');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // If you want to use actual Gemini API (you'll need an API key):
  const analyzeWithGemini = useCallback(async (weatherData) => {
    // This requires setting up Google AI API key
    
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_GEMINI_API_KEY });
    
    const prompt = `As a drone flight safety expert, analyze these weather conditions for UAV flight:
    Temperature: ${weatherData.temperature}°C
    Humidity: ${weatherData.humidity}%
    Wind Speed: ${weatherData.windSpeed} m/s
    Rain: ${weatherData.rain} mm
    Provide brief safety recommendations.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    setAnalysis(response.text);
  }, []);

  return {
    analysis,
    loading,
    error,
    analyzeFlightConditions,
    analyzeWithGemini
  };
}