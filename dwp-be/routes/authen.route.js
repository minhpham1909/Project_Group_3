const bodyParser = require("body-parser");
const express = require("express");
const { AuthenticationController } = require("../controllers");

const authRouter = express.Router();
authRouter.use(bodyParser.json())

authRouter.post("/sign-up", AuthenticationController.signUp);
authRouter.post("/sign-in", AuthenticationController.signIn);
authRouter.post("/sign-out", AuthenticationController.signOut);

module.exports = authRouter;