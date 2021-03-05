const { CheckUserAth } = require("../middlewares/auth");
const express = require("express");

const Router = express.Router();

const {
  Login,
  Register,
  UpdateMyAcctNumber,
  UpdateClient,
  ConfirmPaymentReceived,
} = require("../controllers/user");

Router.post("/login", Login);
Router.get("/updateClient", CheckUserAth, UpdateClient);

Router.post("/Register", Register);
Router.post("/ConfirmPaymentReceived", CheckUserAth, ConfirmPaymentReceived);
Router.post("/UpdateMyAcctNumber", CheckUserAth, UpdateMyAcctNumber);

module.exports = Router;
