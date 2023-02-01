import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";

// Declare the Schema of the Mongo model
const UserSchema = new Schema(
  {
    username: String,
    email: String,
    password: String,
    imagen: { type: String, default: null },
    telefono: { type: String, default: "" },
    bio: { type: String, default: "" },
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    state: { type: Boolean, default: false },
  },
  { timestamps: true }
);
UserSchema.method("toJSON", function () {
  const { __V, _id, password, ...object } = this.toObject();
  object.uid = _id;

  return object;
});

UserSchema.methods.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  // now we set user password to hashed password
  return await bcrypt.hash(password, salt);
};

UserSchema.methods.comparePassword = async function (password) {
  // now we set user password to hashed password
  return await bcrypt.compare(password, this.password);
};

//Export the model
const User = model("Users", UserSchema, "Users");

module.exports = User;
