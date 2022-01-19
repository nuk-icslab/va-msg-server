const Message = require("../model/message");
const SealIMClient = require("./SEAL/identityManagement");
const SealGMClient = require("./SEAL/groupManagement");
const logger = require("./logger");

class ChannelServer {
  constructor(io) {
    this.io = io;
    this.seal = {
      im_client: new SealIMClient(),
      gm_client: new SealGMClient(),
    };
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
      logger.error(e.msg);
      socket.disconnect();
      return;
    }

    logger.info(`[VAL][connected][${user_id}][${socket.id}]`);
    //this.sockets[user_id] = this.sockets[user_id] || {};
    //this.sockets[user_id][socket.id] = socket;

    socket.onAny((event, ...args) => {
      logger.debug(`[VAL][${event}][${user_id}][${socket.id}]`, args);
    });
    socket.on("disconnect", (reason) => {
      logger.info(`[VAL][disconnect][${user_id}][${socket.id}] ${reason}`);
      //delete this.sockets[user_id][socket.id];
    });

    socket.on("message", async (data) => {
      let { group_id, payload } = data;

      // Check whether user_id is in the VAL group
      let user_in_val_group = await this.checkUserInGreoup(user_id, group_id);
      if (!user_in_val_group) {
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
      logger.info(
        `[VAL][message] Forwarded message from ${user_id} to ${group_id}`
      );

      // [TODO] Move to VA server
      // Store the message into database
      let { content, time } = payload;
      let new_msg = new Message({
        user_id,
        group_id,
        content,
        time,
      });
      await new_msg.save();

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

      // Check whether the user is in the VAL group
      let user_in_val_group = await this.checkUserInGreoup(user_id, group_id);
      if (user_in_val_group) {
        socket.join(group_id);
        logger.info(
          `[VAL][subscribe] ${user_id} sucessfully subscribe to channel ${group_id}`
        );
      } else {
        socket.emit("rejeted", { reason: "Not in the VAL group" });
      }

      // if (!(group_id in this.subscrib_list)) {
      //   this.subscrib_list[group_id] = [];
      // }
      // this.subscrib_list[group_id].push(socket.id);

      // [TODO] Move to VA server
      // Look for all of the messages for the group
      let msgs = await Message.find({ group_id });
      // Send to the incoming client
      msgs.forEach((msg) => {
        let { user_id, content, time } = msg;
        socket.emit("message", {
          user_id,
          group_id,
          payload: {
            content,
            time,
          },
        });
      });
    });
    socket.on("unsubscribe", (data) => {
      let { group_id } = data;
      socket.leave(group_id);
      logger.info(
        `[VAL][unsubscribe] ${user_id} unsubscribe from channel ${group_id}`
      );
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
        user_id = await this.seal.im_client.getUserID(access_token);
      } catch (e) {
        logger.debug(e);
      }
      if (user_id === null) {
        reject({
          msg: `[VAL][invaild] ${socket.id} has invail access_token ${access_token}`,
        });
        return;
      }
      resolve(user_id);
    });
  }
  checkUserInGreoup(user_id, group_id) {
    return new Promise(async (resolve, reject) => {
      try {
        if (group_id === "" || user_id === "") {
          resolve(false);
          return;
        }
        let group_info = await this.seal.gm_client.groupDocumentsGroupDocIdGet(
          group_id
        );
        if (!("members" in group_info)) {
          resolve(false);
          return;
        }
        resolve(
          group_info["members"].some(
            (member) => member["valUserId"] === user_id
          )
        );
      } catch (e) {
        logger.error(e);
        resolve(false);
      }
    });
  }
}

module.exports = ChannelServer;
