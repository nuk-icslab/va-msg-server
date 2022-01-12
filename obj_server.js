const Message = require("./model/message");

class ObjServer {
  constructor(io) {
    this.io = io;
    this.subscrib_list = {};
    this.sockets = {};
    this.io.on("connection", this.handleConnection.bind(this));
  }
  handleConnection(socket) {
    console.log(`[connected] ${socket.id}`);
    this.sockets[socket.id] = socket;
    socket.onAny((event, ...args) => {
      console.log(`[${event}][${socket.id}]`, args);
    });
    socket.on("disconnect", () => {
      delete this.sockets[socket.id];
    });

    socket.on("message", async (data) => {
      let { user_id, group_id, time, message } = data;
      message = message.content;
      time;
      // Store the message into database
      let new_msg = new Message({
        user_id,
        group_id,
        message,
        time,
      });
      await new_msg.save();

      // Forward to subscribers
      if (group_id in this.subscrib_list) {
        let subscribe_list = this.subscrib_list[group_id];

        subscribe_list.forEach((socket_id) => {
          try {
            console.log(`Forward to ${socket_id}`);
            this.sockets[socket_id].emit("message", {
              user_id,
              group_id,
              time,
              message,
            });
          } catch (e) {}
        });
      }
    });
    socket.on("subscribe", async (data) => {
      let { group_id } = data;
      if (!(group_id in this.subscrib_list)) {
        this.subscrib_list[group_id] = [];
      }
      this.subscrib_list[group_id].push(socket.id);
      // Look for all of the messages for the group
      let msgs = await Message.find({ group_id });
      // Send to the incoming client
      msgs.forEach((msg) => {
        socket.emit("message", msg);
      });
    });
    socket.on("unsubscribe", (data) => {
      let { group_id } = data;
      if (!(group_id in this.subscrib_list)) return;
      let new_sub_list = this.subscrib_list[group_id].filter(
        (e) => e != socket.id
      );
      this.subscrib_list[group_id] = new_sub_list;
    });
  }
}

module.exports = ObjServer;
