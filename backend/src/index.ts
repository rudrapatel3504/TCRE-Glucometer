import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import patientRoutes from './routes/patient.routes';
import deviceRoutes from './routes/device.routes';
import analysisRoutes from './routes/analysis.routes';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables from the root workspace folder (.env) using robust path discovery
const envPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
  path.join(__dirname, '..', '..', '..', '..', '.env')
];

let loadedEnv = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`[Env] Successfully loaded environment from: ${envPath}`);
    loadedEnv = true;
    break;
  }
}
if (!loadedEnv) {
  dotenv.config(); // fallback to default
  console.log('[Env] Fallback to default dotenv config');
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];

    if (process.env.CORS_ORIGIN) {
      const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
      allowedOrigins.push(...envOrigins);
    }

    const isAllowed = allowedOrigins.includes(origin) || 
                      allowedOrigins.includes('*') ||
                      origin.endsWith('.vercel.app');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
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
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`  TCRE GLUCOMETER SYSTEM BACKEND RUNNING`);
  console.log(`  Port:        ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
});
