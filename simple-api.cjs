const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Weather function
async function getWeather(location) {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = await geocodingResponse.json();

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = await response.json();

  function getWeatherCondition(code) {
    const conditions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    };
    return conditions[code] || 'Unknown';
  }

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get available agents
app.get('/api/agents', async (req, res) => {
  try {
    const agents = ['weatherAgent'];
    res.json({ agents });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get agents', 
      message: error.message 
    });
  }
});

// Get available tools
app.get('/api/tools', async (req, res) => {
  try {
    const tools = ['weather'];
    res.json({ tools });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get tools', 
      message: error.message 
    });
  }
});

// Weather-specific endpoint for mobile convenience
app.get('/api/weather/:location', async (req, res) => {
  try {
    const { location } = req.params;
    
    const result = await getWeather(location);
    res.json({ 
      weather: result,
      location,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get weather', 
      message: error.message 
    });
  }
});

// Weather chat endpoint - combines weather data with agent conversation
app.post('/api/weather/chat', async (req, res) => {
  try {
    const { location, question } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Get weather data first
    const weatherData = await getWeather(location);
    
    // For now, return weather data without agent (since agent needs OpenAI key)
    let agentResponse = null;
    if (question) {
      agentResponse = `Weather agent response would be here for question: "${question}". Please add your OpenAI API key to enable agent responses.`;
    }

    res.json({ 
      weather: weatherData,
      location,
      question,
      agentResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to process weather chat', 
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /api/agents - List available agents`);
  console.log(`  GET  /api/tools - List available tools`);
  console.log(`  GET  /api/weather/:location - Get weather for location`);
  console.log(`  POST /api/weather/chat - Weather chat with agent`);
  console.log(`\n🌤️  Try: http://localhost:${PORT}/api/weather/Istanbul`);
});

module.exports = app; 