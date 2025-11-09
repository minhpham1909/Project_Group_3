const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.json());

const { UserController } = require("../controllers");

router.get("/list", UserController.getAllUsers);
router.post("/forget-password", UserController.forgotPassword);
router.post("/reset-password", UserController.changePassword);
router.get("/:userId", UserController.getUserId);
router.post("/chatBot", UserController.chatBot);

module.exports = router;


