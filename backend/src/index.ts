import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import patientRoutes from './routes/patient.routes';
import deviceRoutes from './routes/device.routes';
import analysisRoutes from './routes/analysis.routes';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables from the root workspace folder (.env)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Support larger payloads for bulk uploads
app.use(requestLogger);

// REST API Endpoints
app.use('/api/patients', patientRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api', analysisRoutes); // Handles /api/analyze and /api/upload-csv
app.use('/', analysisRoutes);     // Handles /analyze and /upload-csv for backwards compatibility


// System Health Status Route (ALB / ECS Readiness checks)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  TCRE GLUCOMETER SYSTEM BACKEND RUNNING`);
  console.log(`  Port:        ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
});
