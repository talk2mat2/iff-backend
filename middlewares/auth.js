const jwt = require("jsonwebtoken");

const UserSchema = require("../models/userMoodel");

exports.CheckUserAth = async function (req, res, next) {
  const token = req.headers.authorization;
  jwt.verify(token, process.env.JWTKEY, async function (err, decodedToken) {
    if (err) {
      return res
        .status(401)
        .send({ message: "auth failed, login to continue" });
    } else {
      req.body.id = decodedToken.user._id;
      const todaysdate = new Date();

      await UserSchema.findByIdAndUpdate(
        { _id: req.body.id },
        { lastSeen: todaysdate },
        { useFindAndModify: false }
      ).catch((err) => console.log(err)),
        next();
    }
  });
};
