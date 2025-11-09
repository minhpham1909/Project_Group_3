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
router.put("/request-supplier/:id", UserController.requestRoleSupplier);

// admin duyệt hoặc từ chối yêu cầu
router.put("/change-request-supplier/:id", UserController.changeRequestSupplier);

module.exports = router;
