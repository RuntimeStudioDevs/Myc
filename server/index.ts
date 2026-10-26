import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.config';
import apiRoutes from './routes/api.routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();

app.use(express.json());

// Montaje de rutas API modulares
app.use('/api', apiRoutes);

// Configuración de Vite (Desarrollo) o Archivos Estáticos (Producción)
async function startServer() {
  if (!config.isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: rootDir,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(rootDir, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(rootDir, 'dist', 'index.html'));
    });
  }

  app.listen(config.port, () => {
    console.log(`[M&C Cotizador] Servidor iniciado en http://localhost:${config.port}`);
  });
}

startServer();
