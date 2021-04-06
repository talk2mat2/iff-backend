const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { selDestruct } = require("../middlewares/auth");
var uniqid = require("uniqid");
const TempRegSchema = require("../models/tempRegModel");
const { sendmail } = require("../middlewares/mailer");

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
      await selDestruct(user, user._id);
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
  // console.log(req.body);
  const {
    // fullName,
    email,
    Password,
    confirmPassword,
    referrerCode,
    // mobile,
  } = req.body;
  const userData = await TempRegSchema.findOne({ Email: email });
  if (!userData) {
    console.log("user details not found for verified accounts");
    return res.status(404).json({ message: "userdata not found" });
  }
  const { fullName, Email, mobile } = userData;

  if (!fullName) {
    return res.status(404).json({ message: "pls provide your full name" });
  }
  if (!referrerCode) {
    return res
      .status(404)
      .json({ message: "you must provide a referrer code" });
  }
  if (!mobile) {
    return res
      .status(404)
      .json({ message: "pls provide a valid phone number" });
  }
  if (mobile) {
    if (!/^[0-9,+]+$/.test(mobile)) {
      return res.status(501).json({
        message: `pls provide a valid phone number ,${mobile} is invalid`,
      });
    }
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

  const checkIsConfirmdedemail = await TempRegSchema.findOne({ Email: Email });
  if (checkIsConfirmdedemail) {
    if (!checkIsConfirmdedemail.isConfirmedEmail) {
      return res.status(404).json({
        message:
          "Email is not confirmed ,go to registeration page to verify your email again or check your email for verification mail",
      });
    }
  }
  if (!checkIsConfirmdedemail) {
    return res.status(404).json({
      message:
        "Email is not confirmed ,go to registeration page to verify your email again or check your email for verification mail",
    });
  }

  const existingUser = await UserSchema.findOne({ Email: Email });
  if (existingUser) {
    return res.status(401).json({
      message: `a user with email ${Email}is already registred, try to login`,
    });
  }

  if (referrerCode) {
    const isValidReferralCode = await UserSchema.findOne({
      referralCode: referrerCode,
    });
    if (!isValidReferralCode) {
      return res.status(401).json({
        message: `invalid referrer code supplied`,
      });
    }
    if (isValidReferralCode && isValidReferralCode.referrals.length > 1) {
      return res.status(501).json({
        message: `the user with the supplied referrer code has reached a maximum of 2 members referrals`,
      });
    }
    if (isValidReferralCode) {
      if (!isValidReferralCode.bank_Acct_Number) {
        return res.status(501).json({
          message: `the user with the supplied referrer has not updated his/her bank account details`,
        });
      }

      if (isValidReferralCode.pay_to_BankNumber) {
        if (!isValidReferralCode.paymentConfirmed) {
          return res.status(501).json({
            message: `the user with the supplied referrer has not send his gift to assigned member or gift not confirmed yet`,
          });
        }
      }
    }
  }

  try {
    const Passwordhash = bcrypt.hashSync(Password, 10);
    const newUser = new UserSchema({
      fullName,
      mobile,
      Email,
      Password: Passwordhash,
      referrerCode: referrerCode && referrerCode,
    });
    await newUser.save();
    //first level referrer
    const referrer = await UserSchema.findOne({ referralCode: referrerCode });
    console.log(referrerCode);
    if (referrer && referrer.referrals.length < 2) {
      // console.log(referrer);
      referrer.referrals.push({
        _id: newUser._id,
        fullName: newUser.fullName,
        Email: newUser.Email,
        mobile: newUser.mobile,
      });
      await referrer.save();
    }

    if (referrer && referrer.referrerCode) {
      const referrersReferrer = await UserSchema.findOne({
        referralCode: referrer.referrerCode,
      });
      console.log("referrerefer", referrersReferrer);
      if (referrersReferrer && referrersReferrer.downLiners.length < 4) {
        //push to grand referrer
        referrersReferrer.downLiners.push({
          _id: newUser._id,
          fullName: newUser.fullName,
          Email: newUser.Email,
          paymentStatus: false,
          mobile: newUser.mobile,
          introducedBy: referrer.fullName,
        });
        await referrersReferrer.save();
        //then we updte new user with the downliners(water position guy/grand referrer) account to pay to
        newUser.pay_to_BankName = referrersReferrer.bank_Name;
        newUser.pay_to_BankNumber = referrersReferrer.bank_Acct_Number;
        newUser.pay_to_BankUserName = referrersReferrer.fullName;
        newUser.pay_to__id = referrersReferrer._id;
        newUser.pay_to__mobile = referrersReferrer.mobile;
        await newUser.save();
      }
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

exports.ConfirmPaymentReceived = async (req, res) => {
  const { payerId } = req.body;

  if (!payerId) {
    console.log("no payer id provided");
    return res.status(404).json({ message: "pls provide your payerId" });
  }
  UserSchema.findById(req.body.id)
    .then((user) => {
      // console.log(user);
      user.downLiners.map(async (payers) => {
        if (payers._id === payerId) {
          // console.log(payers);
          // payers[payers._Id].paymentStatus = true;
          payers["paymentStatus"] = true;
          await user.save();
          UserSchema.findById(payerId)
            .then(async (resdata) => {
              resdata.paymentConfirmed = true;
              await resdata.save();
            })
            .catch((err) => {
              console.log(err);
              return res.status(501).json({ message: "an error occured" });
            });
          this.UpdateClient(req, res);
        }
      });
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(404)
        .json({ message: "an error occured try again or contact admin" });
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

exports.PreRegister = async (req, res) => {
  // console.log(req.body);

  return null;
  const Email = req.body.email;
  const checkIfregistered = await UserSchema.findOne({ Email });
  if (checkIfregistered) {
    return res.status(404).json({
      message: `this email ${Email} is already registered, you can login`,
    });
  }
  if (!Email) {
    return res.status(404).json({ message: "pls provide your email" });
  }
  if (!validateEmail(Email)) {
    return res.status(501).json({
      message: `pls provide a valid email address, ${Email} is invalid `,
    });
  }
  const isPreRegistered = await TempRegSchema.findOne({ Email: Email });
  if (isPreRegistered) {
    const randomId = isPreRegistered.confirmationCode;
    await sendmail(Email, randomId, res);

    //send email with token again
  } else {
    let randomid = uniqid();
    const newPregistered = new TempRegSchema({
      Email,
      confirmationCode: randomid,
    });
    await newPregistered.save();
    //sendmail with new randomid
    sendmail(Email, randomid, res);
  }
};
exports.verifyEmail = async (req, res) => {
  const token = req.query.token;
  const Email = req.query.email;
  // console.log(token,Email)
  if (!Email) {
    return res.status(404).json({ message: "url is invalid" });
  }
  if (!token) {
    return res.status(404).json({ message: "url is invalid" });
  }
  const checkIfRegistered = await UserSchema.findOne({ Email });
  if (checkIfRegistered) {
    return res.status(501).json({
      message:
        "you have already completed registration,no need for more verificaion, you can login",
    });
  }
  try {
    const newUser = await TempRegSchema.findOne({ Email: Email });
    if (newUser) {
      if (newUser.confirmationCode === token && newUser.isApproved === true) {
        newUser.isConfirmedEmail = true;
        await newUser.save();
        return res.status(200).json({
          message: `${Email} is now verified, you will be redirected to registeration page`,
          userData: { email: Email },
        });
      } else {
        return res.status(404).json({
          message: "Token not valid for provided email or not approved",
        });
      }
    } else {
      return res.status(404).json({
        message: "Email not valid, try to re-register for approval again",
      });
    }
  } catch (err) {
    return res.status(501).json({ message: "error occured " });
  }
  // catch(err=>{
  //   return res.status(501).json({ message: "error occured " });
  // })
};

exports.ListUsers = async (req, res) => {
  const userId = req.body.id;
  await UserSchema.findById(userId)
    .then(async (adminUser) => {
      if (!adminUser.isAdmin) {
        return res.status(401).json({ message: "not authorized, admin only" });
      }
      if (adminUser.isAdmin) {
        var pageNo = req.query.pageNo || 0;
        const limit = 15;
        var skip = pageNo * limit;
        var totalCount;
        await UserSchema.countDocuments((err, count) => {
          if (err) {
            totalCount = 0;
          } else {
            totalCount = count;
          }
        });
        // console.log(totalCount)
        if (totalCount == 0) {
          return res.status(404).send({ message: "no users found" });
        }
        UserSchema.find({})
          .skip(skip)
          .limit(limit)
          .select("-Password")
          .then(async (response) => {
            // console.log(response.length);
            // response.totalRecords=totalCount
            return res
              .status(200)
              .send({ userData: response, totalCount, pageNo, limit });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log(err);

      return res.status(502).json({ message: "an error occured" });
    });
};
exports.ListRegRequest = async (req, res) => {
  const userId = req.body.id;
  await UserSchema.findById(userId)
    .then(async (adminUser) => {
      if (!adminUser.isAdmin) {
        return res.status(401).json({ message: "not authorized, admin only" });
      }
      if (adminUser.isAdmin) {
        var pageNo = req.query.pageNo || 0;
        const limit = 15;
        var skip = pageNo * limit;
        var totalCount;
        await TempRegSchema.countDocuments(
          { isApproved: false },
          (err, count) => {
            if (err) {
              totalCount = 0;
            } else {
              totalCount = count;
            }
          }
        );
        // console.log(totalCount)
        if (totalCount == 0) {
          return res.status(404).send({ message: "no users found" });
        }
        TempRegSchema.find({ isApproved: false })
          .skip(skip)
          .limit(limit)
          .then(async (response) => {
            // console.log(response.length);
            // response.totalRecords=totalCount
            return res
              .status(200)
              .send({ userData: response, totalCount, pageNo, limit });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(502).json({ message: "An error occured" });
    });
};
exports.ListApproved = async (req, res) => {
  const userId = req.body.id;
  await UserSchema.findById(userId)
    .then(async (adminUser) => {
      if (!adminUser.isAdmin) {
        return res.status(401).json({ message: "not authorized, admin only" });
      }
      if (adminUser.isAdmin) {
        var pageNo = req.query.pageNo || 0;
        const limit = 15;
        var skip = pageNo * limit;
        var totalCount;
        await TempRegSchema.countDocuments(
          { isApproved: true },
          (err, count) => {
            if (err) {
              totalCount = 0;
            } else {
              totalCount = count;
            }
          }
        );
        // console.log(totalCount)
        if (totalCount == 0) {
          return res.status(404).send({ message: "no users found" });
        }
        TempRegSchema.find({ isApproved: true })
          .skip(skip)
          .limit(limit)
          .then(async (response) => {
            // console.log(response.length);
            // response.totalRecords=totalCount
            return res
              .status(200)
              .send({ userData: response, totalCount, pageNo, limit });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(502).json({ message: "An error occured" });
    });
};

exports.SearchUsers = (req, res) => {
  if (!req.query.search) {
    console.log("empty search");
    return res.status(200).json({ searchResults: [] });
  }
  console.log(req.query.search);
  UserSchema.find({
    $or: [
      { mobile: { $regex: `${req.query.search}`, $options: "i" } },
      { Email: { $regex: `${req.query.search}`, $options: "i" } },
      { fullName: { $regex: `${req.query.search}`, $options: "i" } },
    ],
  })
    .select("-Password")
    .limit(6)
    .then((resdata) => {
      // console.log(resdata);
      res.status(200).json({ userData: resdata });
    })
    .catch((err) => {
      console.log(err);
      res.status(501).json({ message: "an error occured" });
    });
};

exports.DeleteUser = async (req, res) => {
  const { deleteId } = req.query;
  const userId = req.body.id;

  await UserSchema.findById(userId)
    .then(async (adminUser) => {
      if (!adminUser.isAdmin) {
        return res.status(401).json({ message: "not authorized, admin only" });
      }
      if (adminUser.isAdmin) {
        if (!deleteId) {
          return res
            .status(404)
            .json({ message: "no user and userid selected" });
        }
        console.log(deleteId);
        //we try to get the person we are to delete information

        await UserSchema.findById(deleteId)
          .then(async (user) => {
            if (user) {
              //although we need to check if the users has a refferrer before going to the next step but i just omited it
              //because every person must have a referrer except admin
              const UsersReferrer = await UserSchema.findOne({
                referralCode: user.referrerCode,
              });
              //we try to remove him from his referrers array
              if (UsersReferrer) {
                if (
                  UsersReferrer.referrals.some(
                    async (person) => person._id === deleteId
                  )
                ) {
                  await UsersReferrer.referrals.pull({ _id: deleteId });
                  await UsersReferrer.save();
                }
                //then we check if his userreffere has a referrer too and remove him from his donliners
                if (UsersReferrer.referrerCode) {
                  const grandRefferrer = await UserSchema.findOne({
                    referralCode: UsersReferrer.referrerCode,
                  });
                  if (grandRefferrer) {
                    if (
                      grandRefferrer.downLiners.some(
                        async (person) => person._id === deleteId
                      )
                    ) {
                      await grandRefferrer.downLiners.pull({ _id: deleteId });
                      await grandRefferrer.save();
                    }
                  }
                }
              }
              const isPreRegistered = await TempRegSchema.findOne({
                Email: user.Email,
              });
              if (isPreRegistered) {
                await isPreRegistered.deleteOne();
              }
              await user.deleteOne((err, success) => {
                if (err) {
                  return res
                    .status(501)
                    .json({ message: "error occured unable to delete" });
                } else {
                  console.log("deleted account", success);
                  return res.status(200).json({
                    message:
                      "the selected user account has been deleted from the system",
                  });
                }
              });
            }
          })
          .catch((err) => {
            return res
              .status(501)
              .json({ message: "Unable to perfom the requested oper4ation" });
          });
        // await UserSchema.findByIdAndDelete(deleteId)
        //   .then((success) => {
        //     console.log("successs");
        //     return res.status(200).json({
        //       message: "the selected user account has been deleted from the system",
        //     });
        //   })
        //   .catch((err) => {
        //     console.log(err);
        //     return res
        //       .status(501)
        //       .json({ message: "Unable to perfom the requested oper4ation" });
        //   });
      } else {
        return res
          .status(404)
          .json({ message: "only admin can access thi routes" });
      }
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(501)
        .json({ message: "error occured , try again or contact server admin" });
    });
};

exports.ApproveUser = async (req, res) => {
  const userId = req.query.userId;

  const currentUserId = req.body.id;
  await UserSchema.findById(currentUserId)
    .then(async (adminUser) => {
      if (!adminUser.isAdmin) {
        return res.status(401).json({ message: "not authorized, admin only" });
      }

      if (adminUser.isAdmin) {
        if (!userId) {
          return res.status(501).jason({
            message: "no user id  supplied for approval",
          });
        }
        await TempRegSchema.findById(userId).then(async (user) => {
          // console.log("found", user);
          user.isApproved = true;
          await user.save();
          await sendmail(user.Email, user.confirmationCode, res);
          // return res.status(200).json({
          //   message: `this user ${user.fullName} has been approved and a verification mail has been sent to the user to complete registration`,
          // });
        });
      }
    })
    .catch((err) => {
      return res.status(401).json({ message: "Error occured try again later" });
    });
};
exports.RejectRequest = async (req, res) => {
  const userId = req.query.userId;

  const currentUserId = req.body.id;
  await UserSchema.findById(currentUserId)
    .then(async (adminUser) => {
      if (!adminUser.isAdmin) {
        return res.status(401).json({ message: "not authorized, admin only" });
      }

      if (adminUser.isAdmin) {
        if (!userId) {
          return res.status(501).jason({
            message: "no user id  supplied for approval",
          });
        }
        await TempRegSchema.findById(userId).then(async (user) => {
          // console.log("found", user);
          user.isApproved = true;
          await user.deleteOne((err, success) => {
            if (err) {
              return res
                .status(501)
                .json({ message: "error occured unable to delete request" });
            } else {
              console.log("deleted account", success);
              return res.status(200).json({
                message: "The request has been rejected",
              });
            }
          });

          // return res.status(200).json({
          //   message: `this user ${user.fullName} has been approved and a verification mail has been sent to the user to complete registration`,
          // });
        });
      }
    })
    .catch((err) => {
      return res.status(401).json({ message: "Error occured try again later" });
    });
};
