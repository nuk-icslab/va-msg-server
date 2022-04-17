const use_https = true;

const https = require("https");
const http = require("http");
const express = require("express");
const { readFileSync } = require("fs");
const SocketIoServer = require("socket.io").Server;
const ChannelServer = require("./channelServer");
const mongoose = require("mongoose");
const logger = require("./logger");
const cors = require("cors");
const { getLocation } = require("./SEAL/locationManagement");

mongoose
  .connect("mongodb://localhost:27017/val", {
    serverSelectionTimeoutMS: 5000,
  })
  .catch((error) =>
    logger.error("[MongoDB] Failed connecting database ", error)
  );

const app = express();
app.use(cors());
app.use("/", express.static("public"));

// [TODO] Get config based on user loaction
app.get("/config/:user_id", async function (req, res) {
  logger.debug(`Fetching the geolocation of user ${req.params.user_id}`);
  if (req.params.user_id === undefined) {
    res.sendStatus(404);
  } else {
    let { data } = await getLocation(req.params.user_id);
    let { lat, lng } = data;
    let region = "";
    if (lat > 23.5) {
      region = "TPE";
    } else {
      region = "KHH";
    }
    logger.debug(`lat: ${lat}, lng: ${lng}`);
    res.send({
      user_id: req.params.user_id,
      user_agent: req.get("User-Agent"),
      remote_ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      lat,
      lng,
      region,
    });
  }
});

var server = {};
if (use_https) {
  server = https.createServer(
    {
      cert: readFileSync("certs/server.crt"),
      key: readFileSync("certs/server.key"),
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
