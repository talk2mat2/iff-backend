const { CheckUserAth } = require("../middlewares/auth");
const express = require("express");

const Router = express.Router();

const { Login, Register } = require("../controllers/user");

Router.post("/login", Login);

Router.post("/Register", Register);

module.exports = Router;
