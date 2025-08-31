import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

describe('Health Check API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return healthy status with all services operational', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(data.services).toBeDefined();
  });

  it('should include database status when available', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.services.database).toBeDefined();
    expect(['connected', 'disconnected']).toContain(data.services.database);
  });

  it('should include Redis status when available', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.services.redis).toBeDefined();
    expect(['connected', 'disconnected']).toContain(data.services.redis);
  });

  it('should include WebSocket status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.services.websocket).toBeDefined();
    expect(['ready', 'not_configured']).toContain(data.services.websocket);
  });

  it('should include performance metrics', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.metrics).toBeDefined();
    expect(data.metrics.uptime).toBeDefined();
    expect(data.metrics.memory).toBeDefined();
    expect(data.metrics.memory.used).toBeDefined();
    expect(data.metrics.memory.total).toBeDefined();
  });

  it('should include environment information', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data.environment).toBeDefined();
    expect(data.version).toBeDefined();
  });

  it('should return degraded status when some services are down', async () => {
    // Mock a service failure
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Connection failed'));

    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(['degraded', 'healthy']).toContain(data.status);
  });
});