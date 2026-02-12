import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import { webhookRoutes } from './modules/collector/routes.js';
import { identifierRoutes } from './modules/identifier/routes.js';
import { synthesizerRoutes } from './modules/synthesizer/routes.js';
import { roadmapRoutes } from './modules/director/routes.js';
import { notificationRoutes } from './modules/broadcaster/routes.js';
import { portalRoutes } from './modules/portal/routes.js';
import { authRoutes } from './auth/routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Raw body for webhook signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/customers', identifierRoutes);
app.use('/api/features', synthesizerRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/portal', portalRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Propel API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;

