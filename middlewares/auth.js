const jwt = require("jsonwebtoken");

const UserSchema = require("../models/userMoodel");

exports.CheckUserAth = async function (req, res, next) {
  const token = req.headers.authorization;

  jwt.verify(token, process.env.JWTKEY, async function (err, decodedToken) {
    if (err) {
      console.log(err);
      return res
        .status(401)
        .send({ message: "auth failed, login to continue" });
    } else {
      req.body.id = decodedToken.user._id;
      // const todaysdate = new Date();

      await UserSchema.findById(
        { _id: req.body.id },
        { useFindAndModify: false }
      ).then((user) => selDestruct(user, (userid = req.body.id)));
      next();
    }
  });
};

// .catch((err) => console.log(err)),
const selDestruct = async (user, userid) => {
  console.log("selfdestruct called");
  // if (user && user.downLiners.length > 3 && !user.isAdmin) {
  if (user && user.downLiners.length > 3) {
    let completed = 0;
    user.downLiners.map((givers) => {
      if (givers.paymentStatus === true) {
        completed++;
      }
    });
    console.log(completed);
    if (completed === 4) {
      await UserSchema.findOne({ _id: userid })
        .then(async (item) => {
          if (item.recycle_level !== 1) {
            item.recycle_level = 1;
            item.evidenImageUri = "";
            await item.save();
          }
          const Admin = await UserSchema.findOne({ isAdmin: true });
          const firstPerson = item.downLiners[0];
          const FirstDownliers = await UserSchema.findById(firstPerson._id);
          //telling the first person to pay for recycle money to admins account
          if (FirstDownliers) {
            if (Admin) {
              FirstDownliers.pay_to_BankNumber = Admin.bank_Acct_Number;
              FirstDownliers.pay_to_BankName = Admin.bank_Name;
              FirstDownliers.pay_to_BankUserName = Admin.fullName;
              FirstDownliers.pay_to__id = Admin._id;
              FirstDownliers.pay_to__mobile = Admin.mobile;
              await FirstDownliers.save();
            }
          }
          await item.downLiners.map(async (gifters, index) => {
            const giftDownliners = await UserSchema.findOne({
              _id: gifters._id,
            });
            if (giftDownliners) {
              if (giftDownliners.recycle_level === 1) {
                //the first person pays for the recycle board
                //so we take it to the admins account
                //await gifters.save()
                //we use spred operator to spread content of the gifter index and update other values too
                const found = item.recycle_level_members.some(
                  (el) => el._id === gifters._id
                );
                if (!found) {
                  item.recycle_level_members.push({
                    ...gifters,
                    paymentStatus_recycle: false,
                    //we need to provide the recycle account numberfor the first person to pay to
                    evidenImageUri: "",
                  });
                  await item.save();
                }
              }
            }
          });
        })
        .then((res) => {
          console.log("recycle level one unlocked");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  // we add recycleboard reset once the recyclearray has confirmed payments received bello----

  if (user && user.recycle_level_members.length > 3) {
    let completed2 = 0;
    user.recycle_level_members.map((givers) => {
      if (givers.paymentStatus_recycle === true) {
        completed2++;
      }
    });
    console.log(completed2);
    if (completed2 === 4) {
      //here we need to reset the array content to zero
      const params = { recycle_level_members: [] };
      await UserSchema.findByIdAndUpdate(
        { _id: userid },
        {
          $set: params,
        },
        { new: true, useFindAndModify: false }
      )

        .then((res) => {
          console.log("recycle board members has been reset");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
};

exports.selDestruct = selDestruct;
