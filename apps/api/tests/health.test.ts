import { describe, it, expect } from 'vitest';

import { createApp } from '../src/app.js';

describe('Health check', () => {
  it('GET /health returns ok', async () => {
    const app = createApp();
    // Light integration test — not spawning a server, using supertest-style fetch
    const response = await new Promise<{ status: string }>((resolve) => {
      const server = app.listen(0, () => {
        const addr = server.address() as { port: number };
        fetch(`http://localhost:${addr.port}/health`)
          .then((r) => r.json())
          .then((json) => {
            server.close();
            resolve(json as { status: string });
          });
      });
    });
    expect(response.status).toBe('ok');
  });
});
