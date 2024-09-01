const fs = require('fs');
const { supervisionLogger } = require("../src/utils/logger");

const supervision = require('../src/routes/supervision');
const { formatDataAsJson } = require('../src/routes/supervision');
const { getLastRecordFilename } = require('../src/routes/supervision');

beforeAll(() => {
  supervisionLogger.level = "debug";
});

test('formatDataAsJson returns the expected output', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-08-29T11:28:35'));

  const recordedChannels = 'channel1\nchannel2';
  const recordingChannelsDetail = '/bin/sh -c streamlink -O --twitch-disable-ads twitch.tv/channel1 best | ffmpeg -i pipe:0 -c:v copy -f matroska -y /tutu/channel1_2024-08-28_10h00m00s_filename.mkv';
  const expectedOutput = {
    "channel1": {
        "recording": true,
        "file_path": "/tutu/channel1_2024-08-28_10h00m00s_filename.mkv",
        "filename": "channel1_2024-08-28_10h00m00s_filename.mkv",
        "quality": "best",
        "command": "/bin/sh -c streamlink -O --twitch-disable-ads twitch.tv/channel1 best | ffmpeg -i pipe:0 -c:v copy -f matroska -y /tutu/channel1_2024-08-28_10h00m00s_filename.mkv",
        "start_time": "2024-08-28 10:00:00",
        "duration": "1d 1h 28m 35s",
        "last_record": ""
    },
    "channel2": {
        "recording": false,
        "last_record": ""
    }
  };

  const getLastRecordFilenameSpy = jest.spyOn(supervision, "getLastRecordFilename").mockReturnValue("tutu");

  expect(formatDataAsJson(recordedChannels, recordingChannelsDetail)).toEqual(expectedOutput);

  jest.useRealTimers();
  getLastRecordFilenameSpy.mockRestore();
});

test('getLastRecordFilename returns the expected output', () => {
  jest.mock("fs");
  const mockFiles = [
    "channel1_2024-08-28_10h00m00s_filename.mkv",
    "channel1_2024-08-28_11h28m35s_filename.mkv",
    "channel1_2024-08-28_14h12m07s_filename.mkv",
    "channel2_2024-08-28_10h00m00s_filename.mkv"
  ];

  const readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockReturnValue(mockFiles);

  const channelName = "channel1"
  const currentRecordFilename = "channel1_2024-08-28_14h12m07s_filename.mkv"
  const expectedOutput = "channel1_2024-08-28_11h28m35s_filename.mkv"

  expect(getLastRecordFilename(channelName, currentRecordFilename)).toEqual(expectedOutput);

  readdirSyncSpy.mockRestore();
});
