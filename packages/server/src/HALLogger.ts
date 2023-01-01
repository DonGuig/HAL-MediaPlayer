import Winston, { format } from "winston";
import ExpressWinston from "express-winston";
import "winston-daily-rotate-file";
import path from "path";

// Will contain trailing slash
const _dirname = new URL(".", import.meta.url).pathname;
const logPath = path.join(_dirname, "../logs/halmediaplayer_server-%DATE%.log");
const expressLogPath = path.join(_dirname, "../logs/html-%DATE%.log");

const logger = Winston.createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new Winston.transports.DailyRotateFile({
      filename: logPath,
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
    }),
  ],
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new Winston.transports.Console({
      format: format.combine(format.colorize(), format.simple()),
      level:"debug",
    })
  );
}

export const expressLogger = ExpressWinston.logger({
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new Winston.transports.DailyRotateFile({
      filename: expressLogPath,
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
    }),
  ],
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    format.json()
  ),
  meta: true, // optional: control whether you want to log the meta data about the request (default to true)
  msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
  colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  ignoreRoute: function (req, res) {
    return false;
  }, // optional: allows to skip some log messages based on request and/or response
});

export default logger;
