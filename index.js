const fs = require('fs');
const eventStream = require('event-stream');
const axios = require('axios');
require('dotenv').config();
const logger = require('./logger/logger');

const processCSV = (file) => {
  let lineNumber = 1;
  fs.renameSync(`emails/${file}`, `processing/${file}`);
  logger.info(`Moved file: ${file} into processing folder`);

  const reader = fs
    .createReadStream(`processing/${file}`)
    .pipe(eventStream.split())
    .pipe(
      eventStream
        .mapSync(async (row) => {
          reader.pause(); // pause the readstream
          try {
            await callCheckEmail(row);
            reader.resume();
          } catch (error) {
            logger.error(
              `Error with file: ${file} on line: ${lineNumber} - Response message: ${JSON.stringify(error.message)}`
            );
            moveFileAndCheckNextFile(file, 'processing', 'errored');
          }
          lineNumber++;
        })
        .on('error', (err) => {
          logger.error(`Error while reading file: ${file} on line ${lineNumber}`, err);
          moveFileAndCheckNextFile(file, 'processing', 'errored');
        })
        .on('end', () => {
          logger.info(`Processed entire file: ${file}`);
          moveFileAndCheckNextFile(file, 'processing', 'processed');
        })
    );
};

const callCheckEmail = async (row) => {
  const columns = row.split(',');
  return await axios({
    method: 'post',
    headers: { 'x-api-key': process.env.CCS_API_KEY },
    url: process.env.CCS_CHECK_EMAIL_URL,
    data: { Email: columns[2] },
  });
};

const moveFileAndCheckNextFile = (file, from, to) => {
  fs.renameSync(`${from}/${file}`, `${to}/${file}`);
  logger.info(`Moved file: ${file} into ${to} folder`);
  files = fs.readdirSync('emails');
  files.length && processCSV(files[Math.floor(Math.random() * files.length)]);
};

let files = fs.readdirSync('emails');
files.length
  ? processCSV(files[Math.floor(Math.random() * files.length)])
  : console.log('No files found in given folder!');
