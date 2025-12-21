const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

const requestLogger = (req, res, next) => {
  logger.info({
    message: 'incoming_request',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  next();
};

module.exports = {
  logger,
  requestLogger
};


