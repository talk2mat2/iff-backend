const { CheckUserAth } = require("../middlewares/auth");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const Router = express.Router();

const {
  Login,
  Register,
  UpdateMyAcctNumber,
  UpdateClient,
  ConfirmPaymentReceived,
  ConfirmRecyclePaymentReceived,
  PreRegister,
  verifyEmail,
  ListUsers,
  SearchUsers,
  DeleteUser,
  ListRegRequest,
  ApproveUser,
  RejectRequest,
  ListApproved,
  ListFirstMatchedRecyclers,
} = require("../controllers/user");

Router.post("/login", Login);
Router.get("/updateClient", CheckUserAth, UpdateClient);

Router.post("/Register", Register);
Router.post("/ConfirmPaymentReceived", CheckUserAth, ConfirmPaymentReceived);
Router.post(
  "/ConfirmRecyclePaymentReceived",
  CheckUserAth,
  ConfirmRecyclePaymentReceived
);
Router.post("/UpdateMyAcctNumber", CheckUserAth, UpdateMyAcctNumber);
Router.post("/PreRegister", PreRegister);
Router.get("/verifyEmail", verifyEmail);
Router.get("/ListUsers", CheckUserAth, ListUsers);
Router.get("/SearchUsers", CheckUserAth, SearchUsers);
Router.get("/DeleteUser", CheckUserAth, DeleteUser);
Router.get("/ListRegRequest", CheckUserAth, ListRegRequest);
Router.get("/ApproveUser", CheckUserAth, ApproveUser);
Router.get("/RejectRequest", CheckUserAth, RejectRequest);
Router.get("/ListApproved", CheckUserAth, ListApproved);
Router.get(
  "/ListFirstMatchedRecyclers",
  CheckUserAth,
  ListFirstMatchedRecyclers
);

module.exports = Router;
