export const corsOptions = {
    origin: (origin, callback) => {
        // Fallback to localhost and the production deployment URL if the environment variable is not set
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : [
                'http://localhost:3000',
                'http://localhost:5173',
                'http://localhost:5174',
                'http://127.0.0.1:5173',
                'https://yaser-usmle.com',
                'https://www.yaser-usmle.com'
            ];
        // Allow requests with no origin (like mobile apps or curl requests) OR matching origins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Blocked by CORS policy'));
        }
    },
    credentials: true, // Required to allow cookies/authorization headers
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
};
//# sourceMappingURL=cors.config.js.map