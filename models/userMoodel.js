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

const UserSchema = new Schema({
  fullName: { type: String, required: true }, // String is shorthand for {type: String}
  Email: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  level: { type: Number, default: 1 }, //level 1 =fire,2=wind,3=water//id downliners length>0 it becomes water(gifted)
  referralCode: { type: String, default: makeid },
  referrerCode: { type: String }, //introduced by
  mobile: { type: Number },
  pay_to_BankName: { type: String },
  pay_to_BankNumber: { type: String },
  pay_to__mobile: { type: Number },
  pay_to_BankUserName: { type: String },
  pay_to__id: { type: String },
  bank_Name: { type: String },
  bank_Acct_Number: { type: String },
  paymentConfirmed: { type: Boolean, default: false },
  email_confirmed:{ type: Boolean, default: false },
  referrals: [{ _id: String, fullName: String, Email: String ,mobile:Number}], //first generation ,i.e 2 people/i introduced
  downLiners: [
    {
      _id: String,
      fullName: String,
      Email: String,
      paymentStatus: Boolean,
      evidenImageUri: String,
      mobile:Number,
      introducedBy:String
    },
  ], //downliners is 2cond generations of referals 4people
});
//if the confirm 4 payment, you remove yourself from the board

UserSchema.methods.verifyPassword = async function (Password) {
  const match = await bcrypt.compare(Password, this.Password);

  if (match) {
    return true;
  } else {
    return false;
  }
};

module.exports = mongoose.model("Users", UserSchema);
