const express = require("express");
const App = express();
const connectDB = require("./db/connection");
const cors = require("cors");
const UserRoutes = require("./routes/userroutes");

const path = require("path");

// const UserSchema = require("./models/userMoodel");
process.env.NODE_ENV !== "production" ? require("dotenv").config() : null;
connectDB();
const Port = process.env.PORT || 8080;

App.use(cors());

App.use(express.json({ extended: false }));
App.set("views", path.join(__dirname, "views"));
App.set("view engine", "ejs");
App.use("/users", UserRoutes);
App.get("/", (req, res) => {
  res.status(200).send({ message: "ailerserver" });
});

const server = App.listen(Port, (err, successs) => {
  if (err) throw err;
  console.log(`server running on port ${Port}`);
});
// const io = require("socket.io")(server);
