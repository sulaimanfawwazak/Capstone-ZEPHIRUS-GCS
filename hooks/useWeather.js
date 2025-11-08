// hooks/useWeather.js
import { useState, useEffect, useCallback } from 'react';

export function useWeather() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (lat, lon) => {
    if (!lat || !lon) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: "temperature_2m,relative_humidity_2m,rain,wind_speed_10m,wind_direction_10m,weather_code",
        timezone: "auto"
      });

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      const data = await response.json();
      
      if (data.current) {
        setWeatherData({
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          rain: data.current.rain,
          windSpeed: data.current.wind_speed_10m,
          windDirection: data.current.wind_direction_10m,
          weatherCode: data.current.weather_code,
          time: data.current.time
        });
      }
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error('Weather API error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeatherIcon = (weatherCode) => {
    // WMO Weather interpretation codes
    if (weatherCode === 0) return '☀️'; // Clear sky
    if (weatherCode <= 3) return '⛅'; // Partly cloudy
    if (weatherCode <= 48) return '🌫️'; // Fog
    if (weatherCode <= 67) return '🌧️'; // Rain
    if (weatherCode <= 77) return '❄️'; // Snow
    if (weatherCode <= 99) return '⛈️'; // Thunderstorm
    return '🌤️';
  };

  const getFlightConditions = (weather) => {
    if (!weather) return 'Unknown';
    
    const { windSpeed, rain, temperature } = weather;
    
    if (windSpeed > 15) return 'Poor';
    if (windSpeed > 10) return 'Moderate';
    if (rain > 5) return 'Poor';
    if (rain > 2) return 'Moderate';
    if (temperature > 35 || temperature < 0) return 'Moderate';
    
    return 'Good';
  };

  return {
    weatherData,
    loading,
    error,
    fetchWeather,
    getWeatherIcon,
    getFlightConditions
  };
}