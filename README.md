# Mastra MCP Project

Bu proje Mastra AI framework'ü kullanarak MCP (Model Context Protocol) server ve API endpoints oluşturur. Mobil uygulamalar için weather agent ve tool'ları expose eder.

## Özellikler

- **Weather Agent**: Hava durumu bilgileri için AI agent
- **Weather Tool**: Gerçek zamanlı hava durumu verisi
- **MCP Server**: Cursor/Smithery gibi MCP client'lar için
- **REST API**: Mobil uygulamalar için HTTP endpoints
- **CORS Support**: Cross-origin requests için

## Kurulum

1. Dependencies'leri yükleyin:
```bash
npm install
```

2. OpenAI API key'inizi `.env` dosyasına ekleyin:
```bash
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

## Kullanım

### API Server'ı Başlatma

```bash
npm run api
```

API server `http://localhost:3001` adresinde çalışacak.

### MCP Server'ı Başlatma

```bash
npm run mcp
```

MCP server stdio üzerinden çalışacak.

### Mastra Development Server

```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Agents
```
GET /api/agents                           # Mevcut agent'ları listele
POST /api/agents/:agentName/chat          # Agent ile sohbet et
POST /api/agents/weatherAgent/chat        # Weather agent ile sohbet et
```

### Tools
```
GET /api/tools                            # Mevcut tool'ları listele
POST /api/tools/:toolName/execute         # Tool çalıştır
POST /api/tools/weather/execute           # Weather tool çalıştır
```

### Weather Specific
```
GET /api/weather/:location                # Hava durumu bilgisi al
POST /api/weather/chat                    # Hava durumu + agent sohbeti
```

## API Kullanım Örnekleri

### Hava Durumu Bilgisi Alma
```bash
curl http://localhost:3001/api/weather/Istanbul
```

### Agent ile Sohbet
```bash
curl -X POST http://localhost:3001/api/agents/weatherAgent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather like in Istanbul?"}'
```

### Weather Tool Çalıştırma
```bash
curl -X POST http://localhost:3001/api/tools/weather/execute \
  -H "Content-Type: application/json" \
  -d '{"parameters": {"location": "Istanbul"}}'
```

### Weather Chat (Hava Durumu + Agent)
```bash
curl -X POST http://localhost:3001/api/weather/chat \
  -H "Content-Type: application/json" \
  -d '{"location": "Istanbul", "question": "Should I take an umbrella?"}'
```

## MCP Integration

### Cursor/Smithery için

1. `.cursor/mcp.json` dosyası otomatik olarak oluşturuldu
2. Cursor Settings > MCP Settings'den Mastra MCP server'ı enable edin
3. MCP server'ı başlatın: `npm run mcp`

### MCP Tools

- `get_weather`: Hava durumu bilgisi al
- `chat_with_agent`: Weather agent ile sohbet et

### MCP Resources

- `mastra://agents`: Mevcut agent'ları listele
- `mastra://tools`: Mevcut tool'ları listele

## Mobil Uygulama Entegrasyonu

Bu API endpoints'leri mobil uygulamanızda kullanabilirsiniz:

### React Native Örneği

```javascript
// Hava durumu bilgisi alma
const getWeather = async (location) => {
  const response = await fetch(`http://localhost:3001/api/weather/${location}`);
  return response.json();
};

// Agent ile sohbet
const chatWithAgent = async (message) => {
  const response = await fetch('http://localhost:3001/api/agents/weatherAgent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  return response.json();
};

// Weather chat
const weatherChat = async (location, question) => {
  const response = await fetch('http://localhost:3001/api/weather/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, question })
  });
  return response.json();
};
```

## Proje Yapısı

```
src/
├── mastra/
│   ├── agents/
│   │   └── weather-agent.ts      # Weather AI agent
│   ├── tools/
│   │   └── weather-tool.ts       # Weather data tool
│   └── index.ts                  # Mastra configuration
├── api-server.ts                 # REST API server
└── mcp-server.ts                 # MCP protocol server
```

## Geliştirme

### Yeni Agent Ekleme

1. `src/mastra/agents/` klasörüne yeni agent dosyası ekleyin
2. `src/mastra/index.ts` dosyasında agent'ı register edin
3. API ve MCP server'larda agent'ı expose edin

### Yeni Tool Ekleme

1. `src/mastra/tools/` klasörüne yeni tool dosyası ekleyin
2. Tool'u agent'larda kullanılabilir hale getirin
3. API endpoints'lerinde tool'u expose edin

## Troubleshooting

### OpenAI API Key Hatası
`.env` dosyasında `OPENAI_API_KEY` değişkenini kontrol edin.

### Port Çakışması
`PORT` environment variable ile farklı port kullanabilirsiniz:
```bash
PORT=3002 npm run api
```

### MCP Connection Hatası
MCP server'ın çalıştığından ve Cursor'da doğru configure edildiğinden emin olun. 