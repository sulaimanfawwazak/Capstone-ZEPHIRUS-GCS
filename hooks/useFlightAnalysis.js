// hooks/useFlightAnalysis.js
import { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";

export function useFlightAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const analyzeFlightConditions = useCallback(async (weatherData, flightData) => {
    if (!weatherData) return;
    
    setAnalysisLoading(true);
    setAnalysisError(null);
    setShowAnalysis(true); // Show analysis when user clicks

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
      setAnalysisError('Failed to analyze flight conditions');
      console.error('Analysis error:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  // If you want to use actual Gemini API (you'll need an API key):
  const analyzeWithGemini = useCallback(async (weatherData) => {
    if (!weatherData) return;
    
    setAnalysisLoading(true);
    setAnalysisError(null);
    setShowAnalysis(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const prompt = `As a drone flight safety expert, analyze these weather conditions for UAV flight:
      Temperature: ${weatherData.temperature}°C
      Humidity: ${weatherData.humidity}%
      Wind Speed: ${weatherData.windSpeed} m/s
      Rain: ${weatherData.rain} mm
      Don't use Markdown syntax and provide a brief, maximum 3 sentences safety recommendations.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      setAnalysis(response.text);
    } catch (err) {
      setAnalysisError('Failed to get AI analysis');
      console.error('Gemini API error:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const hideAnalysis = useCallback(() => {
    setShowAnalysis(false);
    setAnalysis(null);
    setAnalysisError(null);
  }, []);

  return {
    analysis,
    analysisLoading,
    analysisError,
    showAnalysis,
    analyzeFlightConditions,
    analyzeWithGemini,
    hideAnalysis
  };
}