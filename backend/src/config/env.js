require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  dbSSL: process.env.DB_SSL === "true",
  // databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:1@localhost:5432/sih_db',
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwt',
  mlServiceUrl: (() => {
    if (process.env.ML_SERVICE_URL) {
      if (process.env.ML_SERVICE_URL.startsWith('http')) return process.env.ML_SERVICE_URL;
      if (process.env.ML_SERVICE_URL.includes('localhost') || process.env.ML_SERVICE_URL.includes('127.0.0.1')) {
        return `http://${process.env.ML_SERVICE_URL}`;
      }
      return `https://${process.env.ML_SERVICE_URL}`;
    }
    return 'http://localhost:8000';
  })()
};

module.exports = config;
