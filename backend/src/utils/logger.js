const log4js = require("log4js");
const configPath = process.env.CONFIG || "../config/config.dev.json"
const config = require(configPath);

log4js.configure({
  appenders: {
    console: { type: "console" },
    file: {
      type: "file",
      filename: config.logFilePath,
      maxLogSize: "10M",
      backups: 5,
      compress: true
    }
  },
  categories: {
    default: { appenders: ["console"], level: config.logLevel },
    supervision: { appenders: ["console", "file"], level: config.logLevel }
  }
});

const logger = log4js.getLogger();
const supervisionLogger = log4js.getLogger("supervision");

module.exports = {
  logger,
  supervisionLogger
};
