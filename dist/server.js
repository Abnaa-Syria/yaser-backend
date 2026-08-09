import { createServer } from 'http';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { corsOptions } from './config/cors.config.js';
import { APP_BRAND } from './config/brand.config.js';
// Notice: Rate limiters and specific router middleware should be attached in routes/index.ts where applicable.
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1); // Trust first proxy (e.g. Nginx, Cloudflare)
const PORT = process.env.PORT || 3000;
console.log(PORT);
// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use('/uploads', apiLimiter, express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'deny',
    index: false,
    setHeaders: (res, filePath) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', /[\\/]uploads[\\/]branding[\\/]/.test(filePath)
            ? 'public, max-age=86400'
            : 'private, max-age=300');
        if (/[\\/]uploads[\\/](payment-proofs|homework|payouts)[\\/]/.test(filePath)) {
            res.setHeader('Content-Disposition', 'attachment');
        }
    },
}));
// Apply general rate limiter to all API routes
app.use('/api', apiLimiter);
app.use(morgan('dev'));
// Routes
app.get('/', (req, res) => {
    res.send(`${APP_BRAND.name} Backend is running`);
});
app.get('/api/health', (req, res) => {
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
});
//# sourceMappingURL=server.js.map