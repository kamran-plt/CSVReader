const fs = require('fs');
const eventStream = require('event-stream');
const axios = require('axios');
require('dotenv').config();
const logger = require('./logger/logger');

let lineNumber = 1;
let allFiles;

fs.readdir('./emailFiles/', (err, files) => {
  allFiles = files;
  allFiles.length ? processCSV(files[0]) : console.log('No files found in given folder!');
});

const processCSV = (file) => {
  const reader = fs
    .createReadStream(`emailFiles/${file}`)
    .pipe(eventStream.split())
    .pipe(
      eventStream
        .mapSync((row) => {
          reader.pause(); // pause the readstream
          callCheckEmail(row, lineNumber, file, reader);
          lineNumber++;
        })
        .on('error', (err) => {
          logger.error(`Error while reading file on line ${lineNumber}`, err);
          moveFile(file, 'errored');
          processNextFile();
        })
        .on('end', () => {
          logger.info(`Processed entire file: ${file}`);
          moveFile(file, 'processed');
          processNextFile();
        })
    );
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
        `Error with file: ${file} on line: ${lineNumber} - Response data: ${JSON.stringify(error.response.data)}`
      );
      moveFile(file, 'errored');
      processNextFile();
    });
};

const moveFile = (file, type) =>
  fs.rename(`emailFiles/${file}`, `${type}Files/${file}`, (err) =>
    err ? logger.error(err) : logger.info(`Moved file: ${file} into ${type}Files folder`)
  );

const processNextFile = () => {
  allFiles.shift();
  if (allFiles.length) {
    lineNumber = 1;
    processCSV(allFiles[0]);
  }
};
