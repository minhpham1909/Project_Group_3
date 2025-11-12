const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.json());

const { UserController } = require("../controllers");

router.get("/:userId", UserController.getUserId);

router.get("/list", UserController.getAllUsers);
router.get("/request-list", UserController.getRequest);
router.post("/forget-password", UserController.forgotPassword);
router.post("/reset-password", UserController.changePassword);
router.post("/chatBot", UserController.chatBot);
router.put("/request-supplier/:id", UserController.requestRoleSupplier);
router.put("/approve-request/:userId", UserController.approveRequest);

// admin duyệt hoặc từ chối yêu cầu
module.exports = router;
