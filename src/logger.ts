import * as winston from "winston";
import * as WinstonGraylog2 from "winston-graylog2";

const options = {
  exitOnError: false,
  level: "info",
  transports: [
    new (WinstonGraylog2)({
      name: "Graylog",
      silent: false,
      handleExceptions: false,
      graylog: {
        servers: [
          { host: "graylog.mcltd.cn", port: 12201 },
        ],
        facility: "mc_tracing_helper",
        hostname: require("os").hostname(),
      },
    }),
  ],
};

const logger = new (winston.Logger)(options);

export default logger;
