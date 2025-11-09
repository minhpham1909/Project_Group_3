const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.json());

const { ServiceOrderController } = require("../controllers");
const service_ordersModel = require("../models/service_orders.model");

router.get("/getDetail/:orderId", ServiceOrderController.getDetailOrder);
router.get("/:userId", ServiceOrderController.getOrderByUserId);
router.post("/create-order/:userId", ServiceOrderController.createServiceOrder);
router.post("/create-order-id/:serviceId", ServiceOrderController.createServiceOrderByServiceById);

router.put("/:orderId/status-order", ServiceOrderController.changeStatusOrder);
router.get("/getNotification/:userId", ServiceOrderController.getNotificationByRoleUser);
router.get("/getNotificationBySupplier/:storeId", ServiceOrderController.getNotificationByRoleSupplier);

module.exports = router;


