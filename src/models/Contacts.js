import { Schema, model } from "mongoose";

// Declare the Schema of the Mongo model
var contactSchema = new Schema({
  owner: { type: Schema.ObjectId, ref: "Users" },
  contact: [{ type: Schema.ObjectId, ref: "Users" }],
});

//Export the model
module.exports = model("Contacts", contactSchema, "Contacts");
