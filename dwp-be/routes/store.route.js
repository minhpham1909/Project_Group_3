const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const StoreController = require("../controllers/store.controller");

const router = express.Router();
router.use(bodyParser.json());

// Multer memory storage (không tạo folder tạm)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==========================
// STORE ROUTES
// ==========================
router.get("/stores", StoreController.getAllStores);
router.get("/stores/user/:userId", StoreController.getStoresByUserId);
router.get("/store/:storeId", StoreController.getStoreById);

// Tạo store mới + upload ảnh
router.post("/stores", upload.array("images", 5), StoreController.createStore);

// Cập nhật store + upload / xóa ảnh
router.put(
  "/stores/:storeId",
  upload.array("images", 5),
  StoreController.updateStore
);

// Xóa store
router.delete("/stores/:storeId", StoreController.deleteStore);

module.exports = router;
