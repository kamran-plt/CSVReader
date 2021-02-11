const { createLogger, format, transports } = require('winston');

const myFormat = format.printf(({ level, message }) => {
  return `${new Date()} ${level}: ${message}`;
});

module.exports = createLogger({
  format: myFormat,
  transports: [
    new transports.File({ filename: 'erroredFiles/error.log', level: 'error' }),
    new transports.File({ filename: 'combine.log', level: 'info' }),
  ],
  exitOnError: false,
});
