const fs = require('fs');
const eventStream = require('event-stream');
const axios = require('axios');
require('dotenv').config();
const logger = require('./logger/logger');

let lineNumber = 1;
fs.readdir('./emails/', (err, files) =>
  files.length
    ? processCSV(files[Math.floor(Math.random() * files.length)])
    : console.log('No files found in given folder!')
);

const processCSV = (file) => {
  moveFile(file, 'emails', 'processing', (file) => {
    const reader = fs
      .createReadStream(`processing/${file}`)
      .pipe(eventStream.split())
      .pipe(
        eventStream
          .mapSync((row) => {
            reader.pause(); // pause the readstream
            callCheckEmail(row, lineNumber, file, reader);
            lineNumber++;
          })
          .on('error', (err) => {
            logger.error(`Error while reading file: ${file} on line ${lineNumber}`, err);
            moveFile(file, 'processing', 'errored');
          })
          .on('end', () => {
            logger.info(`Processed entire file: ${file}`);
            moveFile(file, 'processing', 'processed');
          })
      );
  });
};

const callCheckEmail = (row, lineNumber, file, reader) => {
  const columns = row.split(',');
  axios({
    method: 'post',
    headers: { 'x-api-key': process.env.CCS_API_KEY },
    url: process.env.CCS_CHECK_EMAIL_URL,
    data: { Email: columns[2] },
  })
    .then(() => reader.resume()) // resume the readstream
    .catch((error) => {
      logger.error(
        `Error with file: ${file} on line: ${lineNumber} - Response message: ${JSON.stringify(error.message)}`
      );
      moveFile(file, 'processing', 'errored');
    });
};

const moveFile = (file, from, to, cb) =>
  fs.rename(`${from}/${file}`, `${to}/${file}`, (err) => {
    if (err) logger.error(err);
    else {
      logger.info(`Moved file: ${file} into ${to} folder`);
      cb !== undefined && cb(file);
      lineNumber = 1;
      fs.readdir(
        './emails/',
        (err, files) => files.length && processCSV(files[Math.floor(Math.random() * files.length)])
      );
    }
  });
