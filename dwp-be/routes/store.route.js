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
// STORE
// ==========================

// Lấy tất cả cửa hàng
router.get("/listStore", StoreController.getAllStore);

// Lấy store theo ownerId
router.get("/:ownerId", StoreController.getStoreByUserId);

// Tạo store mới + upload ảnh
router.post(
  "/create-store",
  upload.array("images", 5), // max 5 ảnh
  StoreController.createStoreWithImages
);

// Cập nhật store + upload / xóa ảnh
router.put(
  "/update-store/:id",
  upload.array("images", 5),
  StoreController.updateStoreWithImages
);

// ==========================
// SERVICE
// ==========================

// Thêm dịch vụ vào store
router.post("/create-service/:storeId", StoreController.insertSerivceInStore);

// Chỉnh sửa dịch vụ trong store
router.put("/edit-service/:storeId", StoreController.editServiceInStore);

// Lấy dịch vụ theo serviceId
router.get("/get-service/:serviceId", StoreController.getService);

module.exports = router;
