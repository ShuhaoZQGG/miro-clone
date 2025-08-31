import { validateEnvironment, checkServiceHealth, verifyDeployment } from '../../src/lib/deployment/verification';

describe('Deployment Verification', () => {
  describe('Environment Validation', () => {
    it('should validate required environment variables', () => {
      const testEnv = {
        NEXT_PUBLIC_APP_URL: 'https://app.example.com',
        NEXT_PUBLIC_WS_URL: 'wss://ws.example.com',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'test-secret-key',
        SENTRY_DSN: 'https://key@sentry.io/project',
      };

      const result = validateEnvironment(testEnv);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report missing required variables', () => {
      const testEnv = {
        NEXT_PUBLIC_APP_URL: 'https://app.example.com',
      };

      const result = validateEnvironment(testEnv);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('NEXT_PUBLIC_WS_URL is required');
      expect(result.errors).toContain('DATABASE_URL is required');
    });

    it('should validate URL formats', () => {
      const testEnv = {
        NEXT_PUBLIC_APP_URL: 'not-a-url',
        NEXT_PUBLIC_WS_URL: 'wss://ws.example.com',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'test-secret-key',
      };

      const result = validateEnvironment(testEnv);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('NEXT_PUBLIC_APP_URL must be a valid URL');
    });
  });

  describe('Service Health Checks', () => {
    it('should check frontend service health', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      });

      const result = await checkServiceHealth('frontend', 'https://app.example.com');
      expect(result.healthy).toBe(true);
      expect(result.service).toBe('frontend');
      expect(result.responseTime).toBeDefined();
    });

    it('should handle service errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await checkServiceHealth('frontend', 'https://app.example.com');
      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should check WebSocket service health', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'connected', activeConnections: 5 }),
      });

      const result = await checkServiceHealth('websocket', 'https://ws.example.com');
      expect(result.healthy).toBe(true);
      expect(result.details).toHaveProperty('activeConnections', 5);
    });
  });

  describe('Full Deployment Verification', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should verify successful deployment', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy' }),
      });

      const config = {
        frontend: 'https://app.example.com',
        websocket: 'wss://ws.example.com',
        monitoring: 'https://sentry.io',
      };

      const result = await verifyDeployment(config);
      expect(result.success).toBe(true);
      expect(result.services).toHaveLength(3);
      expect(result.services.every(s => s.healthy)).toBe(true);
    });

    it('should report partial deployment failures', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ status: 'healthy' }),
        })
        .mockRejectedValueOnce(new Error('WebSocket unavailable'));

      const config = {
        frontend: 'https://app.example.com',
        websocket: 'wss://ws.example.com',
      };

      const result = await verifyDeployment(config);
      expect(result.success).toBe(false);
      expect(result.failedServices).toContain('websocket');
    });

    it('should validate deployment metrics', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ 
          status: 'healthy',
          metrics: {
            loadTime: 1500,
            latency: 50,
            uptime: 99.9,
          }
        }),
      });

      const config = {
        frontend: 'https://app.example.com',
        requirements: {
          maxLoadTime: 2000,
          maxLatency: 200,
          minUptime: 99.5,
        }
      };

      const result = await verifyDeployment(config);
      expect(result.success).toBe(true);
      expect(result.metricsPass).toBe(true);
    });
  });
});