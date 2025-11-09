const storeModel = require("../models/store.model");

const getAllStore = async (req, res) => {
    try {
        const users = await storeModel.find().populate('ownerId');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllStore2 = async () => {
    try {
        // Lấy tất cả cửa hàng từ DB
        const stores = await storeModel.find();
        
        if (!stores || stores.length === 0) {
            throw new Error('Không có cửa hàng nào trong hệ thống.');
        }
        
        // Kiểm tra cấu trúc dữ liệu của các cửa hàng
        stores.forEach(store => {
            if (!store.nameShop || !Array.isArray(store.services)) {
                throw new Error(`Cửa hàng ${store._id} không có dữ liệu hợp lệ.`);
            }
        });

        return stores; // Trả về danh sách cửa hàng hợp lệ
    } catch (error) {
        console.error("Lỗi khi lấy cửa hàng:", error);
        throw new Error('Không thể lấy thông tin cửa hàng.');
    }
};


const getStoreByUserId = async (req, res) => {
    try {
        const owner = await storeModel.find({ ownerId: req.params.ownerId });

        if (!owner || owner.length === 0) { // Kiểm tra xem có cửa hàng nào không
            return res.status(404).json({ message: "Store not found" }); // Trả về 404 nếu không tìm thấy
        }
         
        const services = owner[0].services.map(service => {
            return { // Thêm từ khóa return và dấu ngoặc nhọn để trả về một object
                "_id": service._id,
                "service_name": service.service_name,
                "service_price": service.service_price, // Sửa lỗi đánh máy "service_priceprice" thành "service.service_price"
            };
        });

        res.status(200).json({
            services: services,
            storeId: owner[0]._id
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getService = async (req, res) => {
    try {
         const store = await storeModel.findOne({ "services._id": req.params.serviceId });
       
               console.log(req.params.serviceId);
       
               if (!store) {
                   return res.status(404).json({ message: "Service not found" });
               }
       
               // Lấy dịch vụ từ mảng services trong store
               const service = store.services.find(s => s._id.toString() === req.params.serviceId.toString());
       
               if (!service) {
                   return res.status(404).json({ message: "Service not found in the store" });
               }

        res.status(200).json({
            serviceImage: store.image,
            serviceName: service.service_name,
            servicePrice: service.service_price,
            storeNameName: store.nameShop,
            storeAddress: store.address,
            storeId: store._id,
            serviceId: service._id
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const insertSerivceInStore = async (req, res) => {
    try {
        const store = await storeModel.findOne({ _id: req.params.storeId });
        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }

        const { services } = req.body;

        store.services.push(...services);
        await store.save();
        res.status(200).json({ message: "Service inserted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const editServiceInStore = async (req, res) => {
    try {
        const store = await storeModel.findOne({ _id: req.params.storeId });
        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }

        // Truyền vào đối tượng dịch vụ (chỉ một đối tượng, không phải mảng)
        const { _id, service_name, service_price, slot_service } = req.body;

        // Kiểm tra xem tất cả các trường có tồn tại trong request không
        if (!_id || !service_name || service_price === undefined || slot_service === undefined) {
            return res.status(400).json({ message: "Thiếu thông tin dịch vụ" });
        }

        // Tìm dịch vụ trong store bằng _id
        const service = store.services.find(service => service._id.toString() === _id.toString());

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Cập nhật thông tin dịch vụ
        service.service_name = service_name;
        service.service_price = service_price;
        service.slot_service = slot_service;

        // Lưu lại thay đổi vào store
        await store.save();

        // Trả về thông báo thành công và dịch vụ đã được cập nhật
        res.status(200).json({ message: "Service updated successfully", updatedService: service });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllStore,
    getStoreByUserId,
    insertSerivceInStore,
    editServiceInStore,
    getService,
    getAllStore2
}
