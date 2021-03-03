const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;
const shortid = require("shortid");

const UserSchema = new Schema({
  fullName: { type: String, required: true }, // String is shorthand for {type: String}
  Email: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  referralCode: { type: String, default: shortid.generate },
  referrals: [{ _id: String, fullName: String, Email: String }],
});

UserSchema.methods.verifyPassword = async function (Password) {
  const match = await bcrypt.compare(Password, this.Password);

  if (match) {
    return true;
  } else {
    return false;
  }
};

module.exports = mongoose.model("Users", UserSchema);
