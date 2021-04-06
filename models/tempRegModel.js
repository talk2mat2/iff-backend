const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;
const shortid = require("shortid");

function makeid() {
  var result = "";
  var characters = "xyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const TempRegSchema = new Schema({
  fullName: { type: String, required: true },
  mobile: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  confirmationCode: { type: String, required: true, unique: true },
  isConfirmedEmail: { type: Boolean, default: false },
  idCardImageUri: { type: String, required: true },
  termsImageUri: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
});
//if the confirm 4 payment, you remove yourself from the board

module.exports = mongoose.model("TempRegSchema", TempRegSchema);
