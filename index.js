const fs = require('fs');
const eventStream = require('event-stream');
const axios = require('axios');
require('dotenv').config();
const logger = require('./logger/logger');

const processCSV = () => {
  let lineNumber = 1;

  files = fs.readdirSync('emails');
  if (files.length === 0) {
    console.log('No files remaining in emails folder!');
    return; // If no files then stop recursion
  }

  const randomFile = files[Math.floor(Math.random() * files.length)];

  fs.renameSync(`emails/${randomFile}`, `processing/${randomFile}`);
  logger.info(`Moved file: ${randomFile} into processing folder`);

  const reader = fs
    .createReadStream(`processing/${randomFile}`)
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
              `Error with file: ${randomFile} on line: ${lineNumber} - Response message: ${JSON.stringify(
                error.message
              )}`
            );
            moveFileAndCheckNextFile(randomFile, 'processing', 'errored');
          }
          lineNumber++;
        })
        .on('error', (err) => {
          logger.error(`Error while reading file: ${randomFile} on line ${lineNumber}`, err);
          moveFileAndCheckNextFile(randomFile, 'processing', 'errored');
        })
        .on('end', () => {
          logger.info(`Processed entire file: ${randomFile}`);
          moveFileAndCheckNextFile(randomFile, 'processing', 'processed');
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
  processCSV();
};

processCSV();
