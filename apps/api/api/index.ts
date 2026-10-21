import { createApp } from '../src/app.js';

const app = createApp();

export default function handler(req: any, res: any) {
  // If Vercel's rewrite changed req.url to /api, restore the incoming path
  const originalUrl =
    (req.headers['x-forwarded-url'] as string | undefined) ||
    (req.headers['x-matched-path'] as string | undefined);

  if ((req.url === '/api' || req.url === '/api/') && originalUrl) {
    req.url = originalUrl;
  }

  return app(req, res);
}
