import { model, Schema } from "mongoose";

// Declare the Schema of the Mongo model
var messageSchema = new Schema({
  from: { type: Schema.ObjectId, ref: "Users" },
  to: { type: Schema.ObjectId, ref: "Users" },
  msg: String,
  createAt: { type: Date, default: Date.now },
  status: { type: String, default: "unread" },
});

//Export the model
module.exports = model("Messages", messageSchema);
