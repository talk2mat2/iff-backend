const { CheckUserAth } = require("../middlewares/auth");
const express = require("express");

const Router = express.Router();

const {
  Login,
  Register,
  UpdateMyAcctNumber,
  UpdateClient,
} = require("../controllers/user");

Router.post("/login", Login);
Router.get("/updateClient", CheckUserAth, UpdateClient);

Router.post("/Register", Register);
Router.post("/UpdateMyAcctNumber", CheckUserAth, UpdateMyAcctNumber);

module.exports = Router;
