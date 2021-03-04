const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const UserSchema = require("../models/userMoodel");

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

exports.Login = async function (req, res) {
  const { Email, Password } = req.body;
  if (!Password || !Email) {
    return res
      .status(404)
      .send({ message: "pls provide a valid password and email" });
  }

  if (!validateEmail(Email)) {
    return res
      .status(404)
      .json({ message: "user with this account is not registered" });
  }

  UserSchema.findOne({ Email }, async function (err, user) {
    if (err) throw err;
    if (!user) {
      res.status(404).json({
        message:
          "user with this email is not registered with us, concider registering",
      });
    } else if (user) {
      const match = await user.verifyPassword(Password);
      if (!match) {
        return res
          .status(401)
          .json({ message: "oopss! , the entered password is not correct." });
      } else {
        user.Password = "";
        return res.json({
          userdata: user,
          token: jwt.sign({ user: user }, process.env.JWTKEY, {
            expiresIn: "17520hr",
          }),
        });
      }
    }
  });
};

exports.Register = async (req, res) => {
  const { fullName, Email, Password, confirmPassword, referrerCode } = req.body;

  if (!fullName) {
    return res.status(404).json({ message: "pls provide your full name" });
  }
  if (!validateEmail(Email)) {
    return res
      .status(404)
      .json({ message: "pls use a valid email address to register" });
  }
  if (confirmPassword != Password) {
    return res.status(404).json({ message: "both password dont match" });
  }
  if (!confirmPassword || !Password || !Email) {
    return res.status(404).json({
      message: "oops! you didnt fill all values required,kindly try again",
    });
  }
  await UserSchema.findOne({ Email: Email }).then((user) => {
    if (user) {
      return res.status(401).send({
        message: `a user with email ${Email}is already registred, try to login`,
      });
    }
  });

  try {
    const Passwordhash = bcrypt.hashSync(Password, 10);
    const newUser = new UserSchema({
      fullName,
      Email,
      Password: Passwordhash,
      referrerCode: referrerCode && referrerCode,
    });
    await newUser.save();
    //first level referrer
    const referrer = await UserSchema.findOne({ referralCode: referrerCode });
    console.log(referrerCode);
    if (referrer && referrer.referrals.length !== 2) {
      console.log(referrer);
      referrer.referrals.push({
        _id: newUser._id,
        fullName: newUser.fullName,
        Email: newUser.Email,
      });
      await referrer.save();
    }

    if (referrer && referrer.referrerCode) {
      const referrersReferrer = await UserSchema.findOne({
        referralCode: referrer.referrerCode,
      });
      console.log("referrerefer", referrersReferrer);
      if (referrersReferrer && referrersReferrer.downLiners !== 4) {
        //push to grand referrer
        referrersReferrer.downLiners.push({
          _id: newUser._id,
          fullName: newUser.fullName,
          Email: newUser.Email,
        });
        await referrersReferrer.save();
        //then we updte new user with the downliners(water position guy/grand referrer) account to pay to
        newUser.pay_to_BankName = referrersReferrer.bank_Name;
        newUser.pay_to_BankNumber = referrersReferrer.bank_Acct_Number;
        newUser.pay_to_BankUserName = referrersReferrer.fullName;
        await newUser.save();
      }
      // if (referrersReferrer && referrersReferrer.downLiners === 4) {
      //   //push to grand referrer
      //   referrersReferrer.downLiners.push({
      //     _id: newUser._id,
      //     fullName: newUser.fullName,
      //     Email: newUser.Email,
      //   });
      // }
    }

    return res.status(200).send({ message: "account registered successfully" });
  } catch (err) {
    console.log(err);
    return res.status(501).send({
      message: "error occured pls try again or contact admin",
      err: err,
    });
  }
};

exports.UpdateMyAcctNumber = async (req, res) => {
  const { bank_Name, bank_Acct_Number } = req.body;
  if (!bank_Name) {
    return res.status(404).json({ message: "pls provide your bank_Name" });
  }
  if (!bank_Acct_Number) {
    return res.status(404).json({ message: "pls provide bank_Acct_Number" });
  }
  if (bank_Acct_Number && bank_Acct_Number.length > 15) {
    return res.status(404).json({ message: "account nmber is invalid" });
  }

  const params = { bank_Name, bank_Acct_Number };

  UserSchema.findByIdAndUpdate(
    { _id: req.body.id },
    {
      $set: params,
    },
    { new: true, useFindAndModify: false }
  )
    .select("-Password")
    .then((user) => {
      return res.json({
        userdata: user,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(401).send({ err: "an error occured,unable to send" });
    });
  // bank_Name: { type: String },
  // bank_Acct_Number: { type: String },
};

exports.UpdateClient = (req, res) => {
  UserSchema.findById(req.body.id)
    .then((user) => {
      return res.json({
        userdata: user,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(401).send({ err: "an error occured,unable to send" });
    });
};

// exports.UpdateUserData = async function (req, res) {
//   const {

//   } = req.body;
//   // for (values in req.body) {
//   //   if (req.body[values] === "Null") return (req.body[values] = null);
//   // }
//   const params = {

//   };
//   for (let prop in params) {
//     if (
//       params[prop] === "null" ||
//       params[prop] === undefined ||
//       params[prop] === null
//     ) {
//       delete params[prop];
//     }
//   }
//   // console.log(params);
//   UserSchema.findByIdAndUpdate(
//     { _id: req.body.id },
//     {
//       $set: params,
//     },
//     { new: true, useFindAndModify: false }
//   )
//     .select("-Password")
//     .then((user) => {
//       return res.json({
//         userdata: user,
//       });
//     })
//     .catch((err) => {
//       console.log(err);
//       res.status(401).send({ err: "an error occured,unable to send" });
//     });
// };
