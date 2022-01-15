const { transports, createLogger, format } = require("winston");

const logger = createLogger({
  level: "debug",
  format: format.combine(
    format.colorize(),
    format.align(),
    //format.timestamp(),
    format.simple()
  ),
  defaultMeta: {},
  transports: [new transports.Console()],
});

module.exports = logger;
