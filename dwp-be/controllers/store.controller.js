const storeModel = require("../models/store.model");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

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
// 🟢 LẤY 1 CỬA HÀNG THEO ID
// ==========================
const getStoreById = async (req, res) => {
  try {
    const store = await storeModel.findById(req.params.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Upload trực tiếp từ buffer
    const uploadResults = await Promise.all(
      req.files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "stores" },
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          })
      )
    );

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

    // Upload ảnh mới trực tiếp từ buffer
    if (req.files && req.files.length > 0) {
      const uploadResults = await Promise.all(
        req.files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { folder: "stores" },
                (err, result) => {
                  if (err) reject(err);
                  else resolve(result);
                }
              );
              streamifier.createReadStream(file.buffer).pipe(stream);
            })
        )
      );
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
// 🟢 XÓA CỬA HÀNG
// ==========================
const deleteStore = async (req, res) => {
  try {
    const store = await storeModel.findByIdAndDelete(req.params.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    for (const url of store.image) {
      const publicId = url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`stores/${publicId}`);
    }

    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getService = async (req, res) => {
  try {
    const store = await storeModel.findOne({
      "services._id": req.params.serviceId,
    });

    console.log(req.params.serviceId);

    if (!store) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Lấy dịch vụ từ mảng services trong store
    const service = store.services.find(
      (s) => s._id.toString() === req.params.serviceId.toString()
    );

    if (!service) {
      return res
        .status(404)
        .json({ message: "Service not found in the store" });
    }

    res.status(200).json({
      serviceImage: store.image,
      serviceName: service.service_name,
      servicePrice: service.service_price,
      storeNameName: store.nameShop,
      storeAddress: store.address,
      storeId: store._id,
      serviceId: service._id,
    });
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
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getService,
};
