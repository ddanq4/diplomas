import winston from 'winston';
import 'winston-daily-rotate-file';

const isProd = process.env.NODE_ENV === 'production';

const fileTransport = new winston.transports.DailyRotateFile({
    dirname: 'logs',
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxSize: '10m',
    maxFiles: '14d',
    level: 'info',
});

const consoleTransport = new winston.transports.Console({
    level: isProd ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, reqId, ...meta }) => {
            const base = `[${timestamp}] ${level}`;
            const rid = reqId ? ` [rid:${reqId}]` : '';
            const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${base}${rid} ${message}${rest}`;
        })
    ),
});

export const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {},
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.json()
    ),
    transports: [fileTransport, consoleTransport],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' })
    ],
});

export const loggerStream = {
    write: (message) => logger.info(message.trim())
};
