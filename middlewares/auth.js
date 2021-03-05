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
      ).then((user) => {
        console.log(user);
        if (user && user.downLiners.length > 3) {
          let completed = 0;
          user.downLiners.map((givers) => {
            // if (
            //   givers[0].paymentStatus === true &&
            //   givers[1].paymentStatus === true &&
            //   givers[2].paymentStatus === true &&
            //   givers[3].paymentStatus === true
            // ) {
            //   console.log("completed");
            //   //
            // }
            if (givers.paymentStatus === true) {
              completed += 1;
            }
          });
          console.log(completed);
          if (completed === 4) {
            UserSchema.deleteOne({ _id: req.body.id })
              .then((res) => {
                console.log("account deleted");
              })
              .catch((err) => {
                console.log(err);
              });
          }
        }
      });
      next();
    }
  });
};

// .catch((err) => console.log(err)),
