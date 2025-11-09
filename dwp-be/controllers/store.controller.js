const storeModel = require("../models/store.model");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================
// 🟢 LẤY TẤT CẢ CỬA HÀNG
// ==========================
const getAllStore = async (req, res) => {
  try {
    const stores = await storeModel.find().populate("ownerId");
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 LẤY STORE THEO USER
// ==========================
const getStoreByUserId = async (req, res) => {
  try {
    const store = await storeModel.find({ ownerId: req.params.ownerId });
    if (!store || store.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    const services = store[0].services.map((s) => ({
      _id: s._id,
      service_name: s.service_name,
      service_price: s.service_price,
    }));

    res.status(200).json({
      services,
      storeId: store[0]._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 LẤY DỊCH VỤ THEO ID
// ==========================
const getService = async (req, res) => {
  try {
    const store = await storeModel.findOne({
      "services._id": req.params.serviceId,
    });
    if (!store) return res.status(404).json({ message: "Service not found" });

    const service = store.services.find(
      (s) => s._id.toString() === req.params.serviceId.toString()
    );

    if (!service)
      return res.status(404).json({ message: "Service not found in store" });

    res.status(200).json({
      serviceImage: store.image,
      serviceName: service.service_name,
      servicePrice: service.service_price,
      storeName: store.nameShop,
      storeAddress: store.address,
      storeId: store._id,
      serviceId: service._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 THÊM DỊCH VỤ VÀO STORE
// ==========================
const insertSerivceInStore = async (req, res) => {
  try {
    const store = await storeModel.findById(req.params.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { services } = req.body;
    store.services.push(...services);
    await store.save();

    res.status(200).json({ message: "Service inserted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 CHỈNH SỬA DỊCH VỤ TRONG STORE
// ==========================
const editServiceInStore = async (req, res) => {
  try {
    const store = await storeModel.findById(req.params.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { _id, service_name, service_price, slot_service } = req.body;
    if (
      !_id ||
      !service_name ||
      service_price === undefined ||
      slot_service === undefined
    )
      return res.status(400).json({ message: "Thiếu thông tin dịch vụ" });

    const service = store.services.find(
      (s) => s._id.toString() === _id.toString()
    );
    if (!service) return res.status(404).json({ message: "Service not found" });

    service.service_name = service_name;
    service.service_price = service_price;
    service.slot_service = slot_service;

    await store.save();

    res
      .status(200)
      .json({
        message: "Service updated successfully",
        updatedService: service,
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 TẠO STORE MỚI (TẠO DỊCH VỤ + UP ẢNH)
// ==========================
const createStoreWithImages = async (req, res) => {
  try {
    const { nameShop, address, ownerId, services } = req.body;

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "Vui lòng upload ít nhất 1 ảnh" });

    const uploadResults = await Promise.all(
      req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "stores" })
      )
    );

    req.files.forEach((f) => fs.unlinkSync(f.path));

    const imageUrls = uploadResults.map((r) => r.secure_url);

    const newStore = new storeModel({
      nameShop,
      address,
      ownerId,
      services: services ? JSON.parse(services) : [],
      image: imageUrls,
    });

    await newStore.save();

    res
      .status(201)
      .json({ message: "Store created successfully", store: newStore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 CẬP NHẬT STORE (THÔNG TIN + ẢNH)
// ==========================
const updateStoreWithImages = async (req, res) => {
  try {
    const storeId = req.params.id;
    const { nameShop, address, services, removeImages } = req.body;

    const store = await storeModel.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    let updatedImages = [...store.image];

    // Xóa ảnh cũ
    if (removeImages && removeImages.length > 0) {
      const removeList = Array.isArray(removeImages)
        ? removeImages
        : JSON.parse(removeImages);
      for (const url of removeList) {
        const publicId = url.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`stores/${publicId}`);
      }
      updatedImages = updatedImages.filter((url) => !removeList.includes(url));
    }

    // Upload ảnh mới
    if (req.files && req.files.length > 0) {
      const uploadResults = await Promise.all(
        req.files.map((file) =>
          cloudinary.uploader.upload(file.path, { folder: "stores" })
        )
      );
      req.files.forEach((f) => fs.unlinkSync(f.path));
      const newUrls = uploadResults.map((r) => r.secure_url);
      updatedImages = [...updatedImages, ...newUrls];
    }

    const updatedStore = await storeModel.findByIdAndUpdate(
      storeId,
      {
        nameShop,
        address,
        services: services ? JSON.parse(services) : store.services,
        image: updatedImages,
      },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Store updated successfully", store: updatedStore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// Export tất cả
// ==========================
module.exports = {
  getAllStore,
  getStoreByUserId,
  getService,
  insertSerivceInStore,
  editServiceInStore,
  createStoreWithImages,
  updateStoreWithImages,
};
