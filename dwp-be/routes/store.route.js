const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.json());

const { StoreController } = require("../controllers");

router.get("/listStore", StoreController.getAllStore);
router.get("/:ownerId", StoreController.getStoreByUserId);
router.post("/create-service/:storeId", StoreController.insertSerivceInStore);
router.put("/edit-service/:storeId", StoreController.editServiceInStore);
router.get("/get-service/:serviceId", StoreController.getService);

module.exports = router;


