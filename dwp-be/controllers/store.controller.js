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
const getAllStores = async (req, res) => {
  try {
    const stores = await storeModel.find().populate("ownerId");
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 LẤY TẤT CẢ CỬA HÀNG THEO USER
// ==========================
const getStoresByUserId = async (req, res) => {
  try {
    const stores = await storeModel.find({ ownerId: req.params.userId });
    if (!stores || stores.length === 0)
      return res.status(404).json({ message: "No stores found for this user" });
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 LẤY TẤT CẢ SERVICE CỦA 1 CỬA HÀNG
// ==========================
const getServicesByStoreId = async (req, res) => {
  try {
    const store = await storeModel.findById(req.params.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.status(200).json({ services: store.services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 LẤY 1 SERVICE THEO ID
// ==========================
const getServiceById = async (req, res) => {
  try {
    const store = await storeModel.findOne({
      "services._id": req.params.serviceId,
    });
    if (!store) return res.status(404).json({ message: "Service not found" });

    const service = store.services.find(
      (s) => s._id.toString() === req.params.serviceId.toString()
    );

    res.status(200).json({ service, storeId: store._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 TẠO CỬA HÀNG MỚI
// ==========================
const createStore = async (req, res) => {
  try {
    const { nameShop, address, ownerId, services } = req.body;

    if (!req.files || req.files.length === 0)
      return res
        .status(400)
        .json({ message: "Please upload at least 1 image" });

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
// 🟢 CẬP NHẬT CỬA HÀNG
// ==========================
const updateStore = async (req, res) => {
  try {
    const storeId = req.params.storeId;
    const { nameShop, address, services, removeImages } = req.body;

   console.log("Body:", req.body); // Check nameShop, services, removeImages
   console.log("Files:", req.files); // ← QUAN TRỌNG: Array files? Paths?
   console.log("New images count:", req.files ? req.files.length : 0);


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

const getStoreById = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await storeModel.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// 🟢 XÓA CỬA HÀNG
// ==========================
const deleteStore = async (req, res) => {
  try {
    const store = await storeModel.findByIdAndDelete(req.params.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    // Xóa ảnh trên Cloudinary
    for (const url of store.image) {
      const publicId = url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`stores/${publicId}`);
    }

    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 THÊM SERVICE VÀO STORE
// ==========================
const addServiceToStore = async (req, res) => {
  try {
    const store = await storeModel.findById(req.params.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { services } = req.body;
    if (!services || services.length === 0)
      return res.status(400).json({ message: "No services provided" });

    store.services.push(...services);
    await store.save();
    res.status(200).json({
      message: "Services added successfully",
      services: store.services,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 CẬP NHẬT SERVICE TRONG STORE
// ==========================
const updateServiceInStore = async (req, res) => {
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
      return res.status(400).json({ message: "Missing service info" });

    const service = store.services.find(
      (s) => s._id.toString() === _id.toString()
    );
    if (!service) return res.status(404).json({ message: "Service not found" });

    service.service_name = service_name;
    service.service_price = service_price;
    service.slot_service = slot_service;

    await store.save();
    res.status(200).json({ message: "Service updated successfully", service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// 🟢 XÓA SERVICE TRONG STORE
// ==========================
const deleteServiceInStore = async (req, res) => {
  try {
    const store = await storeModel.findById(req.params.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const serviceIndex = store.services.findIndex(
      (s) => s._id.toString() === req.params.serviceId.toString()
    );
    if (serviceIndex === -1)
      return res.status(404).json({ message: "Service not found" });

    store.services.splice(serviceIndex, 1);
    await store.save();
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================
// Export tất cả
// ==========================
module.exports = {
  getAllStores,
  getStoresByUserId,
  getServicesByStoreId,
  getServiceById,
  createStore,
  updateStore,
  deleteStore,
  addServiceToStore,
  updateServiceInStore,
  deleteServiceInStore,
  getStoreById,
};
