require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  dbSSL: process.env.DB_SSL === "true",
  // databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:1@localhost:5432/sih_db',
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwt',
  mlServiceUrl: (() => {
    let url = process.env.ML_SERVICE_URL;
    if (url) {
      if (!url.startsWith('http')) {
        url = url.includes('.onrender.com') ? `https://${url}` : `http://${url}`;
      }
      return url.replace(/\/$/, '');
    }
    return 'http://localhost:8000';
  })()
};

module.exports = config;
