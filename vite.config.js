import { defineConfig, loadEnv } from 'vite';
import { fetchFestivals } from './festival.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'TOUR_API_');
  return {
    plugins: [{
      name: 'local-festival-api',
      configureServer(server) {
        server.middlewares.use('/api/festivals', async (request, response) => {
          if (request.method !== 'GET') {
            response.writeHead(405).end();
            return;
          }
          try {
            const festivals = await fetchFestivals(env.TOUR_API_SERVICE_KEY || process.env.TOUR_API_SERVICE_KEY);
            response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            response.end(JSON.stringify({ festivals }));
          } catch (error) {
            server.config.logger.error(`Festival lookup failed: ${error.message}`);
            response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            response.end(JSON.stringify({ festivals: [] }));
          }
        });
      }
    }]
  };
});
