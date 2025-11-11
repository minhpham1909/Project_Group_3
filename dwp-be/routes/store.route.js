const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const router = express.Router();
router.use(bodyParser.json());

// Multer config: lưu tạm file trong folder 'uploads'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// Controller
const StoreController = require("../controllers/store.controller");

// ==========================
// STORE ROUTES
// ==========================

// Lấy tất cả cửa hàng
router.get("/stores", StoreController.getAllStores);

// Lấy tất cả cửa hàng của 1 user
router.get("/stores/user/:userId", StoreController.getStoresByUserId);

// Lấy tất cả service của 1 store
router.get("/stores/:storeId/services", StoreController.getServicesByStoreId);
router.get("/store/:storeId", StoreController.getStoreById);

// Lấy 1 service theo serviceId
router.get("/services/:serviceId", StoreController.getServiceById);

// Tạo store mới + upload ảnh
router.post(
  "/stores",
  upload.array("images", 5), // max 5 ảnh
  StoreController.createStore
);

// Cập nhật store + upload / xóa ảnh
router.put(
  "/stores/:storeId",
  upload.array("images", 5),
  StoreController.updateStore
);

// Xóa store
router.delete("/stores/:storeId", StoreController.deleteStore);

// ==========================
// SERVICE ROUTES (trong store)
// ==========================

// Thêm service vào store
router.post("/stores/:storeId/services", StoreController.addServiceToStore);

// Cập nhật service trong store
router.put(
  "/stores/:storeId/services/:serviceId",
  StoreController.updateServiceInStore
);

// Xóa service trong store
router.delete(
  "/stores/:storeId/services/:serviceId",
  StoreController.deleteServiceInStore
);

module.exports = router;
