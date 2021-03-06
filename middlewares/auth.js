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
  console.log(user);
  if (user && user.downLiners.length > 3) {
    let completed = 0;
    user.downLiners.map((givers) => {
      if (givers.paymentStatus === true) {
        completed++;
      }
    });
    console.log(completed);
    if (completed === 4) {
      UserSchema.deleteOne({ _id: userid })
        .then((res) => {
          console.log("account deleted");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
};

exports.selDestruct = selDestruct;
