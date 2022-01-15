const use_https = false;

if (use_https) {
  var { createServer } = require("https");
} else {
  var { createServer } = require("http");
}
const { readFileSync } = require("fs");
const { Server } = require("socket.io");
const ChannelServer = require("./channelServer");
const mongoose = require("mongoose");
const logger = require("./logger");

mongoose
  .connect("mongodb://localhost:27017/val", {
    serverSelectionTimeoutMS: 5000,
  })
  .catch((error) =>
    logger.error("[MongoDB] Failed connecting database ", error)
  );
const server = createServer(
  use_https
    ? {
        cert: readFileSync("certs/cert.pem"),
        key: readFileSync("certs/key.pem"),
      }
    : {}
);

const io = new Server(server, { cors: { origin: "*" } });
const channel_server = new ChannelServer(io);

server.listen(30000, () => {
  logger.info("[VAL][Channel Enabler] Listening on *:30000");
});
