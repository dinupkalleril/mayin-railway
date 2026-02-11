import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from './routes/auth.js';
import apiKeysRoutes from './routes/apiKeys.js';
import brandRoutes from './routes/brand.js';
import visibilityRoutes from './routes/visibility.js';
import websiteScanRoutes from './routes/websiteScan.js';
import sentimentRoutes from './routes/sentiment.js';
import actionPlanRoutes from './routes/actionPlan.js';
import modelsRoutes from './routes/models.js';
import modelConfigRoutes from './routes/modelConfig.js';
import { licenseGuard } from './middleware/licenseGuard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ============================
// CORS CONFIG (Railway-safe)
// ============================

const allowList = [
  process.env.FRONTEND_ORIGIN,
  'http://localhost:3000',
  'http://143.244.130.11:3000',
  /\.up\.railway\.app$/,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    console.log(`CORS Check: origin='${origin}'`);

    // Allow server-to-server / health checks
    if (!origin) {
      return callback(null, true);
    }

    const allowed = allowList.some((o) =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );

    console.log(`CORS Result: ${allowed ? 'ALLOWED' : 'DENIED'}`);

    callback(null, allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================
// BODY PARSERS
// ============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================
// REQUEST LOGGING
// ============================

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============================
// HEALTH CHECK (DO NOT GUARD)
// ============================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ============================
// ROUTES
// ============================

// Public routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/model-config', modelConfigRoutes);

// License-protected routes
app.use('/api/api-keys', licenseGuard, apiKeysRoutes);
app.use('/api/brand', licenseGuard, brandRoutes);
app.use('/api/visibility', licenseGuard, visibilityRoutes);
app.use('/api/website-scan', licenseGuard, websiteScanRoutes);
app.use('/api/sentiment', licenseGuard, sentimentRoutes);
app.use('/api/action-plan', licenseGuard, actionPlanRoutes);
app.use('/api/models', licenseGuard, modelsRoutes);

// ============================
// SERVE FRONTEND (AFTER API ROUTES)
// ============================

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================
// ERROR HANDLER (MUST BE LAST)
// ============================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});



// ============================
// STARTUP LOGIC
// ============================

async function verifySchema(db) {
  const { rows } = await db.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'licenses'
      AND column_name IN ('license_key', 'assigned_to', 'machine_id')
  `);

  const typeMap = rows.reduce((acc, r) => {
    acc[r.column_name] = r.data_type;
    return acc;
  }, {});

  const mustBeText = ['license_key', 'assigned_to', 'machine_id'];
  const invalid = mustBeText.filter(
    (c) => typeMap[c] && typeMap[c] !== 'text'
  );

  if (invalid.length) {
    throw new Error(
      `Invalid DB schema: columns must be TEXT → ${invalid.join(', ')}`
    );
  }
}

async function waitForDatabase(retries = 30, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("✅ Database is ready");
      return;
    } catch (err) {
      const code = err.code || err.name || 'UNKNOWN_ERROR';
      const msg = err.message || 'no message';
      console.log(`⏳ Waiting for database... (${i + 1}/${retries}) [${code}] ${msg}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Database not ready after retries");
}



async function start() {
  try {
    const retries = parseInt(process.env.DB_STARTUP_RETRIES || '60', 10);
    const delay = parseInt(process.env.DB_STARTUP_DELAY_MS || '5000', 10);

    // Helpful visibility into DATABASE_URL host/port (redacted)
    try {
      const url = new URL(process.env.DATABASE_URL);
      console.log(
        `🔌 DB target → host: ${url.hostname}, port: ${url.port || '5432'}, db: ${url.pathname.replace('/', '')}`
      );
    } catch {
      console.log('🔌 DB target → could not parse DATABASE_URL');
    }

    await waitForDatabase(retries, delay);
    await verifySchema(pool);

    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("[Startup] Fatal error:", err.message);
    setTimeout(() => process.exit(1), 5000);
  }
}

start();



// ============================
// GRACEFUL SHUTDOWN
// ============================

async function gracefulShutdown(signal) {
  console.log(`\n[Shutdown] Received ${signal}. Cleaning up running scans...`);
  try {
    const result = await pool.query(
      `UPDATE visibility_scans
       SET status = 'failed',
           error_message = 'Server shutdown - scan interrupted',
           updated_at = NOW()
       WHERE status IN ('pending', 'running')`
    );

    if (result.rowCount > 0) {
      console.log(`[Shutdown] Marked ${result.rowCount} scan(s) as failed`);
    }

    await pool.end();
    console.log('[Shutdown] Database pool closed');
  } catch (error) {
    console.error('[Shutdown] Cleanup error:', error.message);
  }

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
