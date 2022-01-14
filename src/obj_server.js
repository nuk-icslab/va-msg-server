const Message = require("../model/message");
const SealIMClient = require("./seal_im_client");

class ObjServer {
  constructor(io) {
    this.io = io;
    this.seal_im_client = new SealIMClient();
    //this.subscrib_list = {};
    //this.sockets = {};
    this.io.on("connection", this.handleConnection.bind(this));
    this.io.eio.pingTimeout = 120000; // 2 minutes
    this.io.eio.pingInterval = 5000; // 5 seconds
  }
  async handleConnection(socket) {
    // Verify the access token before accept the connection
    let user_id = null;
    try {
      user_id = await this.verifyAccessToken(socket);
      socket.data.user_id = user_id;
    } catch (e) {
      console.error(e);
      socket.disconnect();
      return;
    }

    console.log(`[connected][${user_id}][${socket.id}]`);
    //this.sockets[user_id] = this.sockets[user_id] || {};
    //this.sockets[user_id][socket.id] = socket;

    socket.onAny((event, ...args) => {
      console.log(`[${event}][${user_id}][${socket.id}]`, args);
    });
    socket.on("disconnect", (reason) => {
      console.log(`[disconnect][${user_id}][${socket.id}] ${reason}`);
      //delete this.sockets[user_id][socket.id];
    });

    socket.on("message", async (data) => {
      let { user_id, group_id, payload } = data;
      // [TODO] Check whether user_id is in the VAL group
      let user_id_in_val_group = true;
      if (!user_id_in_val_group) {
        socket.emit("rejeted", { reason: "Not in the VAL group" });
        return;
      }

      // [TODO] Ask VA server whether the message should be released
      let release_msg = true;
      if (!release_msg) {
        socket.emit("rejeted", { reason: "Reject by VA server" });
      }

      this.io.to(group_id).emit("message", {
        user_id,
        group_id,
        payload,
      });

      // message = message.content;
      // time;
      // // Store the message into database
      // let new_msg = new Message({
      //   user_id,
      //   group_id,
      //   message,
      //   time,
      // });
      // await new_msg.save();

      // // Forward to subscribers
      // if (group_id in this.subscrib_list) {
      //   let subscribe_list = this.subscrib_list[group_id];

      //   subscribe_list.forEach((socket_id) => {
      //     try {
      //       console.log(`Forward to ${socket_id}`);
      //       this.sockets[socket_id].emit("message", {
      //         user_id,
      //         group_id,
      //         time,
      //         message,
      //       });
      //     } catch (e) {}
      //   });
      // }
    });
    socket.on("subscribe", async (data) => {
      let { group_id } = data;

      // [TODO] Check whether the user is in the VAL group
      let user_in_val_group = true;
      if (user_in_val_group) {
        socket.join(group_id);
      } else {
        socket.emit("rejeted", { reason: "Not in the VAL group" });
      }

      // if (!(group_id in this.subscrib_list)) {
      //   this.subscrib_list[group_id] = [];
      // }
      // this.subscrib_list[group_id].push(socket.id);
      // // Look for all of the messages for the group
      // let msgs = await Message.find({ group_id });
      // // Send to the incoming client
      // msgs.forEach((msg) => {
      //   socket.emit("message", msg);
      // });
    });
    socket.on("unsubscribe", (data) => {
      let { group_id } = data;
      socket.leave(group_id);
      // if (!(group_id in this.subscrib_list)) return;
      // let new_sub_list = this.subscrib_list[group_id].filter(
      //   (e) => e != socket.id
      // );
      // this.subscrib_list[group_id] = new_sub_list;
    });
  }
  verifyAccessToken(socket) {
    return new Promise(async (resolve, reject) => {
      if (!("access_token" in socket.handshake.auth)) {
        reject({
          msg: "missing access_token field in the auth header",
        });
        return;
      }
      let access_token = socket.handshake.auth["access_token"];
      let user_id = null;
      try {
        user_id = await this.seal_im_client.getUserID(access_token);
      } catch (e) {
        console.debug(e);
      }
      if (user_id === null) {
        reject({
          msg: `[invaild] ${socket.id} has invail access_token ${access_token}`,
        });
        return;
      }
      resolve(user_id);
    });
  }
}

module.exports = ObjServer;
