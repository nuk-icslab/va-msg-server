const use_https = false;

if (use_https) {
  var { createServer } = require("https");
} else {
  var { createServer } = require("http");
}
const { readFileSync } = require("fs");
const { Server } = require("socket.io");
const ObjServer = require("./obj_server");
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect("mongodb://localhost:27017/val");
})();
const server = createServer(
  use_https
    ? {
        cert: readFileSync("certs/cert.pem"),
        key: readFileSync("certs/key.pem"),
      }
    : {}
);

const io = new Server(server, { cors: { origin: "*" } });
const obj_server = new ObjServer(io);

server.listen(30000, () => {
  console.log("listening on *:30000");
});
