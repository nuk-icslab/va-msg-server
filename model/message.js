const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  user_id: String,
  group_id: String,
  message: String,
  time: Date,
});

const Message = mongoose.model("messages", MessageSchema);

module.exports = Message;
