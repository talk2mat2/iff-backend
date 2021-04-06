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
  PreRegister,
  verifyEmail,
  ListUsers,
  SearchUsers,
  DeleteUser,
  ListRegRequest,
  ApproveUser,
  RejectRequest,
  ListApproved,
} = require("../controllers/user");

Router.post("/login", Login);
Router.get("/updateClient", CheckUserAth, UpdateClient);

Router.post("/Register", Register);
Router.post("/ConfirmPaymentReceived", CheckUserAth, ConfirmPaymentReceived);
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

module.exports = Router;
