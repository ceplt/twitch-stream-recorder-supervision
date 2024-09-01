const { exec } = require("child_process");
const express = require("express");
const fs = require('fs');
const { supervisionLogger } = require("../utils/logger");
const configPath = process.env.CONFIG || "../config/config.dev.json"
const config = require(configPath);

const router = express.Router();

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        if (error.code === 1) { // correctly executed command, but with no results
          resolve('');
        } else {
          supervisionLogger.error(`Error executing command: ${command}\n${error}`);
          reject(error);
          return;
        }
      }
      if (stderr) {
        supervisionLogger.warn(`Error executing command: ${command}\n${stderr}`);
        reject(new Error(stderr));
        return;
      }
      supervisionLogger.debug(`Executing command: ${command}\nResult: ${stdout}`);
      resolve(stdout);
    });
  });
};

const commandResponseToCleanList = (commandResponse) => {
  const cleanList = commandResponse.split('\n').filter(line => line.trim() !== '');
  supervisionLogger.debug(`Formated command output: ${cleanList}`);
  return cleanList;
}

const getRecordStartTime = (recordFilename) => {
  let startTime = recordFilename.split('_').slice(1, 3);
  startTime = `${startTime[0]} ${startTime[1].replace(/d|h|m/g, ':').replace('s', '')}`;
  supervisionLogger.debug(`Getting record start time from filename: ${recordFilename}\nResult: ${startTime}`);
  return startTime;
};

const getNumberInTime = (timeWithLetter) => {
  return parseInt(timeWithLetter.slice(0, -1));
}

const getNowDateParisTimezone = () => {
  // sv = sweden, their date format is close to the correct format
  return new Date(new Date().toLocaleString("sv", {timeZone: "Europe/Paris"}).replace(' ', 'T'));
}

const getDateDiffWithNowTimestamp = (date) => {
  const startDate = new Date(date);
  const endDate = getNowDateParisTimezone();
  return endDate.getTime() - startDate.getTime();
}

const getRecordDuration = (recordStartTime) => {
  const diffTimestamp = getDateDiffWithNowTimestamp(recordStartTime);
  const diffSec = Math.floor(diffTimestamp / 1000);
  const diffMin = Math.floor(diffTimestamp / (60 * 1000));
  const diffHour = Math.floor(diffTimestamp / (60 * 60 * 1000));
  const diffDay = Math.floor(diffTimestamp / (24 * 60 * 60 * 1000));

  supervisionLogger.debug(`Timestamp diff between now and recording start date: ${diffTimestamp}`);

  let times = [
    {
      "time": `${diffDay}d`,
      "isDisplayed": false
    },
    {
      "time": `${diffHour % 24}h`,
      "isDisplayed": false
    },
    {
      "time": `${diffMin % 60}m`,
      "isDisplayed": false
    },
    {
      "time": `${diffSec % 60}s`,
      "isDisplayed": true
    },
  ]

  supervisionLogger.debug(`Calculated times of record duration (default isDisplayed): `, times);

  times.forEach((value, index) => {
    if (!index && getNumberInTime(value.time)) {
      value.isDisplayed = true;
      
    } else if (index) {
      if (times[index - 1].isDisplayed || (getNumberInTime(value.time) && !value.isDisplayed)) {
        value.isDisplayed = true;
      }
    }
  })

  supervisionLogger.debug(`Calculated times of record duration (updated isDisplayed): `, times);

  const displayedTimes = times.map(obj => obj.isDisplayed ? obj.time : null).filter(time => time !== null).join(' ');
  supervisionLogger.debug(`Displayed times: ${displayedTimes}`);

  return displayedTimes
}

const getLastRecordFilename = (channelName, currentRecordFilename) => {
  const records = fs.readdirSync(config.streamRecorderOutputPath);

  supervisionLogger.debug(`Records found:`, records);

  const recordedFilesOfChannel = Array.from(records, (obj) => obj.includes(channelName) ? obj:null).filter(obj => obj !== null);
  supervisionLogger.debug(`Records corresponding to channel '${channelName}': `, recordedFilesOfChannel);

  let lastRecord = "";
  let lastRecordAgeTimestamp = "";
  for (const record of recordedFilesOfChannel) {
    supervisionLogger.debug(`Proceeding record:`, record);

    const currentRecordAgeTimestamp = currentRecordFilename ? getDateDiffWithNowTimestamp(getRecordStartTime(currentRecordFilename)) : "";
    const recordAgeTimestamp = getDateDiffWithNowTimestamp(getRecordStartTime(record));

    if ((recordAgeTimestamp < lastRecordAgeTimestamp || !lastRecordAgeTimestamp) && recordAgeTimestamp != currentRecordAgeTimestamp) {
      lastRecordAgeTimestamp = recordAgeTimestamp;
      lastRecord = record;
    }
  }

  supervisionLogger.debug(`Last record of channel '${channelName}': `, lastRecord);

  return lastRecord;
}

const formatDataAsJson = (recordedChannels, recordingChannelsDetail) => {
  let jsonObject = {};
  let recording;

  if (recordedChannels) {
    const recordedChannelsList = commandResponseToCleanList(recordedChannels);
    
    Array.from(recordedChannelsList).forEach(channel => { jsonObject[channel] = {} });

    if (recordingChannelsDetail) {
      const recordingChannelsDetailList = commandResponseToCleanList(recordingChannelsDetail);
      recording = true;

      for (const recordingChannelDetail of recordingChannelsDetailList) {
        const channelName = recordingChannelDetail.split(' ')[5].replace("twitch.tv/", '');
        const recordFilepath = recordingChannelDetail.split(' ')[16];
        const recordFilename = recordFilepath.split('/').pop();
        const recordQuality = recordingChannelDetail.split(' ')[6];
        const recordCommand = recordingChannelDetail;
        const recordStartTime = getRecordStartTime(recordFilename);
        const recordDuration = getRecordDuration(recordStartTime);
        const lastRecord = getLastRecordFilename(channelName, recordFilename);

        jsonObject[channelName].recording = recording;
        jsonObject[channelName].file_path = recordFilepath;
        jsonObject[channelName].filename = recordFilename;
        jsonObject[channelName].quality = recordQuality;
        jsonObject[channelName].command = recordCommand;
        jsonObject[channelName].start_time = recordStartTime;
        jsonObject[channelName].duration = recordDuration;
        jsonObject[channelName].last_record = lastRecord;
      }
    }

    recording = false

    for (channel of recordedChannelsList) {
      if (!jsonObject[channel].recording) {
        const channelName = channel;
        const lastRecord = getLastRecordFilename(channelName, "");

        jsonObject[channelName].recording = recording;
        jsonObject[channelName].last_record = lastRecord;
      }
    }
  }

  return jsonObject;
};

router.get("/", async (req, res) => {
  try {
    supervisionLogger.debug("Fetching recorded channels and recording channels detail");
    const [recordedChannels, recordingChannelsDetail] = await Promise.all([
      execCommand(config.recordedChannelsCommand),
      execCommand(config.recordingChannelsDetailCommand)
    ]);

    const data = formatDataAsJson(recordedChannels, recordingChannelsDetail);
    res.json(data);

  } catch (error) {
    supervisionLogger.error(`Error executing commands: ${error}`);
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  formatDataAsJson,
  getLastRecordFilename
};
