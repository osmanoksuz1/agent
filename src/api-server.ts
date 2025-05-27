import express from 'express';
import cors from 'cors';
import { weatherAgent } from './mastra/agents/weather-agent';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Weather function (extracted from the tool)
async function getWeather(location: string) {
  interface GeocodingResponse {
    results: {
      latitude: number;
      longitude: number;
      name: string;
    }[];
  }
  
  interface WeatherResponse {
    current: {
      time: string;
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      wind_gusts_10m: number;
      weather_code: number;
    };
  }

  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  function getWeatherCondition(code: number): string {
    const conditions: Record<number, string> = {
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
      message: error instanceof Error ? error.message : 'Unknown error' 
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
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Chat with the weather agent
app.post('/api/agents/weatherAgent/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await weatherAgent.generate(message);
    res.json({ 
      response: result.text || 'No response from agent',
      agent: 'weatherAgent',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to chat with agent', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Generic agent chat endpoint
app.post('/api/agents/:agentName/chat', async (req, res) => {
  try {
    const { agentName } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // For now, only support weatherAgent
    if (agentName !== 'weatherAgent') {
      return res.status(404).json({ error: `Agent ${agentName} not found` });
    }

    const result = await weatherAgent.generate(message);
    res.json({ 
      response: result.text || 'No response from agent',
      agent: agentName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to chat with agent', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Execute weather tool
app.post('/api/tools/weather/execute', async (req, res) => {
  try {
    const { parameters } = req.body;

    if (!parameters || !parameters.location) {
      return res.status(400).json({ error: 'Location parameter is required' });
    }

    const result = await getWeather(parameters.location);
    res.json({ 
      result,
      tool: 'weather',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to execute tool', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Generic tool execution endpoint
app.post('/api/tools/:toolName/execute', async (req, res) => {
  try {
    const { toolName } = req.params;
    const { parameters } = req.body;

    // For now, only support weather tool
    if (toolName !== 'weather') {
      return res.status(404).json({ error: `Tool ${toolName} not found` });
    }

    if (!parameters || !parameters.location) {
      return res.status(400).json({ error: 'Location parameter is required' });
    }

    const result = await getWeather(parameters.location);
    res.json({ 
      result,
      tool: toolName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to execute tool', 
      message: error instanceof Error ? error.message : 'Unknown error' 
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
      message: error instanceof Error ? error.message : 'Unknown error' 
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
    
    // If there's a question, ask the agent
    let agentResponse: string | null = null;
    if (question) {
      const prompt = `Based on this weather data for ${location}: ${JSON.stringify(weatherData)}\n\nUser question: ${question}`;
      const result = await weatherAgent.generate(prompt);
      agentResponse = result.text || null;
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
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /api/agents - List available agents`);
  console.log(`  GET  /api/tools - List available tools`);
  console.log(`  POST /api/agents/:agentName/chat - Chat with an agent`);
  console.log(`  POST /api/tools/:toolName/execute - Execute a tool`);
  console.log(`  GET  /api/weather/:location - Get weather for location`);
  console.log(`  POST /api/weather/chat - Weather chat with agent`);
});

export default app; 