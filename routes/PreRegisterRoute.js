const { CheckUserAth } = require("../middlewares/auth");
const UserSchema = require("../models/userMoodel");
const express = require("express");
var uniqid = require("uniqid");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Router = express.Router();
process.env.NODE_ENV !== "production" ? require("dotenv").config() : null;
const TempRegSchema = require("../models/tempRegModel");

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEYS_CLOUD,
  api_secret: process.env.API_SECRET_CLOUD,
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(
      null,
      "./upload2"
      //  path.join(__dirname, "../public/image")
    );
  },
  filename: function (req, file, cb) {
    cb(
      null,

      file.fieldname + "-" + `${uuidv4()}` + path.extname(file.originalname)
    );
  },
});

const fileFilter = async (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  // dest: "public/image/uploaded",
  storage: storage,

  fileFilter: fileFilter,
});

Router.post("/PreRegUpLoad", upload.array("file"), async (req, res) => {
  // console.log(req.body);
  console.log("file is", req.files.length);
  const file = req.files;

  const { userData } = req.body;
  const DataInfo = JSON.parse(userData);
  const Email = DataInfo.email;
  const mobile = DataInfo.mobile;
  const fullName = DataInfo.fullName;
  console.log(Email, fullName, mobile);
  const checkIfregistered = await UserSchema.findOne({ Email });
  if (checkIfregistered) {
    return res.status(404).json({
      message: `this email ${Email} is already registered, you can login`,
    });
  }
  if (!Email) {
    return res.status(404).json({ message: "pls provide your email" });
  }
  if (!fullName) {
    return res.status(404).json({ message: "pls provide your full name" });
  }
  if (!mobile) {
    return res.status(404).json({ message: "pls provide your phone number" });
  }
  if (mobile) {
    if (!/^[0-9,+]+$/.test(mobile)) {
      return res.status(501).json({
        message: `pls provide a valid phone number ,${mobile} is invalid`,
      });
    }
  }
  if (!validateEmail(Email)) {
    return res.status(501).json({
      message: `pls provide a valid email address, ${Email} is invalid `,
    });
  }

  if (req.files.length < 2) {
    return res.status(501).json({
      message: `you need to provide two images of a valid idcard and terms and condition written on paper `,
    });
  }
  const uniqueFilename = `${uuidv4()}iffpre`;
  const uploader = async (path) =>
    await cloudinary.uploader.upload(path, {
      public_id: `image/${Email}/${uuidv4()}iffpre}`,
      tags: `image`,
    });

  const urls = [];
  const files = req.files;
  try {
    for (const file of files) {
      console.log(file.originalname);
      const Path = file.path;

      const newPath = await uploader(Path);
      urls.push(newPath);
      console.log(newPath.asset_id);
      console.log(newPath.url);
      fs.unlinkSync(Path);
    }
  } catch (err) {
    return res
      .status(501)
      .json({ message: " error occured unable to upload images" });
  }

  // res.status(200).json({
  //   message: "images uploaded successfully",
  //   data: urls,
  // });

  const isPreRegistered = await TempRegSchema.findOne({ Email: Email });
  if (isPreRegistered) {
    const randomId = isPreRegistered.confirmationCode;
    isPreRegistered.termsImageUri = urls[1]["url"];
    isPreRegistered.idCardImageUri = urls[0]["url"];
    await isPreRegistered.save();
    // await sendmail(Email, randomId, res);
    //here we alert admins that we have pre-registered await their aproval
    console.log("yesss");
    //send email with token again
    return res.status(200).json({
      message:
        "your information has been sent to IFF for reviews, you will be contacted after the review via email or sms,if not you can re-apply after 24 hours",
    });
  } else {
    let randomid = uniqid();
    const newPregistered = new TempRegSchema({
      Email,
      confirmationCode: randomid,
      mobile: mobile,
      fullName: fullName,
      termsImageUri: urls[1]["url"],
      idCardImageUri: urls[0]["url"],
    });
    await newPregistered.save();
    return res.status(200).json({
      message:
        "your information has been sent to IFF for reviews, you will be contacted after the review via email or sms,if not you can re-apply after 24 hours",
    });
    //sendmail with new randomid
    // sendmail(Email, randomid, res);
    console.log("yesss");
    //here we alert admins that we have pre-registered await their aproval
  }

  // const payerId = req.body.id;
  // const filter = { _id: pay_to__id };

  // if (!pay_to__id) {
  //   return res.status(501).send({ message: "no Gifted user provided " });
  // }
  // await UserSchema.findOne(filter)
  //   .then((Gifted) => {
  //     if (!file) {
  //       console.log("no file");
  //       return res.status(501).send({ message: "no image provided" });
  //     }

  //     if (file) {
  //       const uniqueFilename = `${uuidv4()}iff`;
  //       const Path = req.file.path;

  //       cloudinary.uploader.upload(
  //         Path,
  //         {
  //           public_id: `image/${req.body.id}/${uniqueFilename}`,
  //           tags: `image`,
  //         },
  //         function (err, image) {
  //           if (err) {
  //             console.log(err);
  //             return res.send({
  //               message: "unable to perfom the requested operation",
  //             });
  //           }

  //           console.log("file uploaded to Cloudinary server");

  //           // remove file from server
  //           // const fs = require("fs");
  //           fs.unlinkSync(Path);
  //           // return image details
  //           console.log(image.secure_url);

  //           Gifted.downLiners.forEach(async (payers) => {
  //             if (payers._id === payerId) {
  //               // console.log(payers);
  //               // payers[payers._Id].paymentStatus = true;
  //               payers["evidenImageUri"] = image.secure_url;
  //               await Gifted.save();

  //               // this.UpdateClient(req, res);
  //             }
  //           });

  //           return res
  //             .status(200)
  //             .send({ response: "your payment evidence has been sent" });
  //         }
  //       );
  //     }
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     console.log(err, "no Gifted user found with that user id provided");
  //     res.status(501).send({
  //       message:
  //         "an error occucured, unable to process your request, thats all we know",
  //     });
  //   });
});

module.exports = Router;
