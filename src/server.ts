import 'dotenv/config';
import { createServer } from 'http';
import express, { Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { corsOptions } from './config/cors.config.js';
import { APP_BRAND } from './config/brand.config.js';
// Notice: Rate limiters and specific router middleware should be attached in routes/index.ts where applicable.
import { apiLimiter } from './middlewares/rateLimit.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Application = express();
app.set('trust proxy', 1); // Trust first proxy (e.g. Nginx, Cloudflare)
const PORT = process.env.PORT || 3000;
console.log(PORT);

// Security middleware — CORP must be cross-origin so the SPA on another subdomain can read API responses.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors(corsOptions));
// Blog/CMS payloads can include long HTML; file uploads use multer on dedicated routes.
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', apiLimiter, (req, res, next) => {
    // Deny public access to sensitive folders — use authenticated download endpoints.
    if (/^\/?(payment-proofs|payouts)(\/|$)/i.test(req.path)) {
        return res.status(401).json({
            status: 'fail',
            message: 'Authentication required to access this file',
        });
    }
    next();
}, express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'deny',
    index: false,
    setHeaders: (res, filePath) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', /[\\/]uploads[\\/]branding[\\/]/.test(filePath)
            ? 'public, max-age=86400'
            : 'private, max-age=300');
    },
}));

// Apply general rate limiter to all API routes
app.use('/api', apiLimiter);
app.use(morgan('dev'));


// Routes
app.get('/', (req: Request, res: Response) => {
    res.send(`${APP_BRAND.name} Backend is running`);
});

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: `${APP_BRAND.name} API is running with TypeScript`,
    });
});

// Register Central Router
import apiRouter from './routes/index.js';
import { initSocket } from './socket/index.js';

const httpServer = createServer(app);
initSocket(httpServer);
app.use('/api/v1', apiRouter);

import { globalErrorHandler } from './middlewares/error.middleware.js';

app.use(globalErrorHandler);

httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    import('./bootstrap/ensureRbac.js')
      .then(({ ensureRbacCatalog }) => ensureRbacCatalog())
      .catch((err) => console.error('[rbac] failed to ensure catalog', err));
    import('./jobs/expiry-cron.js')
      .then(({ startExpiryCron }) => startExpiryCron())
      .catch((err) => console.error('[expiry-cron] failed to start', err));
});
