import pkg from 'pg';
const { Pool } = pkg;

let poolConfig;

// Railway / managed platforms
if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // required for Railway Postgres
    },
  };
} 
// Docker Compose / local / VPS
else {
  poolConfig = {
    host: process.env.POSTGRES_HOST || 'postgres',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: false,
  };
}

export const pool = new Pool(poolConfig);




