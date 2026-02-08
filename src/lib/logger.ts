import winston from 'winston';

// Create a new Winston logger instance
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
	defaultMeta: { service: 'got-archive' },
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(winston.format.colorize(), winston.format.simple())
		}),
		new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
		new winston.transports.File({ filename: 'logs/combined.log', level: 'info' })
	]
});

if (process.env.NODE_ENV === 'production') {
	logger.remove(new winston.transports.Console());
}

export default logger;
