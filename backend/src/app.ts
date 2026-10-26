import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import platformRoutes from './modules/platform/platform.routes';
import discoveryRoutes from './modules/discovery/discovery.routes';
import mappingRoutes from './modules/mapping/mapping.routes';
import governanceRoutes from './modules/governance/governance.routes';
import consentRoutes from './modules/consent/consent.routes';
import dsrRoutes from './modules/dsr/dsr.routes';
import cookieRoutes from './modules/cookies/cookie.routes';

const app = express();

const corsOptions: cors.CorsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Srujana DPDP Compliance Monolith API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/platform', platformRoutes);
app.use('/api/v1/discovery', discoveryRoutes);
app.use('/api/v1/mapping', mappingRoutes);
app.use('/api/v1/governance', governanceRoutes);
app.use('/api/v1/consent', consentRoutes);
app.use('/api/v1/dsr', dsrRoutes);
app.use('/api/v1/cookies', cookieRoutes);

// 404 Catch-all Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// Central Error Handler
app.use(errorHandler);

export default app;
