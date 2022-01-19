const use_https = true;

const https = require("https");
const http = require("http");
const express = require("express");
const { readFileSync } = require("fs");
const SocketIoServer = require("socket.io").Server;
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

const app = express();
app.use("/", express.static("public"));

var server = {};
if (use_https) {
  server = https.createServer(
    {
      cert: readFileSync("certs/app.crt"),
      key: readFileSync("certs/app.key"),
    },
    app
  );
} else {
  server = http.createServer(app);
}

const io = new SocketIoServer(server, { cors: { origin: "*" } });
const channel_server = new ChannelServer(io);

server.listen(443, () => {
  logger.info("[VAL][Channel Enabler] Listening on *:443");
  logger.info("[APP] Listening on *:443");
});
