const ServiceOrders = require("../models/service_orders.model");
const Store = require("../models/store.model");
const actions = require('../actions/requestController.action');
const userModel = require("../models/user.model");
const { sendEmail } = require("../services/mailService.service");

const getDetailOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await ServiceOrders.findById(orderId)
            .populate('customerId', 'account.email profile.name')
            .populate('storeId', 'nameShop address');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Trả về đơn hàng tìm được
        res.status(200).json(order);
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getOrderByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const orders = await ServiceOrders.find({ customerId: userId })
            .populate('storeId', 'nameShop address');

        res.status(200).json(orders);
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createServiceOrder = async (req, res) => {
    try {
        const { storeId, services, orderDate } = req.body;

        console.log(req.body);

        // Tạo một đối tượng đơn hàng mới
        const newOrder = new ServiceOrders({
            customerId: req.params.userId,
            storeId,
            services,
            orderDate,
            status: "Pending"
        });

        console.log("name", services.map(service => service.service_name).join(', '));

        const user = await userModel.findById(req.params.userId);

        const nameShop = await Store.findById(storeId);

        // Lưu đơn hàng vào MongoDB
        await newOrder.save();

        const authCode = {
            message: "Order created successfully",
            order: newOrder,
            service_name: services.map(service => service.service_name),
            service_price: services.map(service => service.service_price),
            store_name: nameShop.nameShop,
            date: orderDate
        };

        res.status(201).json(authCode);
        await sendEmail(user.account.email, user.profile.name, authCode, actions.BOOKING_SERVICE);


    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createServiceOrderByServiceById = async (req, res) => {
    try {
        const { order_time, customerId, service_price, slot_service } = req.body;
        const { serviceId } = req.params;
        const store = await Store.findOne({ "services._id": serviceId });

        const user = await userModel.findById(customerId);

         console.log(order_time);

        if (!store) {
            return res.status(404).json({ message: "Service not found" });
        }

        const service = store.services.find(s => s._id.toString() === serviceId);

        if (!service) {
            return res.status(404).json({ message: "Service not found in the store" });
        }

        if (!service_price || !slot_service) {
            return res.status(400).json({ message: "Service price and slot service are required" });
        }

        console.log(req.body);

        // Tạo đối tượng đơn hàng mới
        const newOrder = new ServiceOrders({
            customerId: customerId,
            storeId: store._id,  // Dùng store._id thay vì store.storeId.nameShop
            services: {
                serviceId: service._id,  // Dịch vụ từ mảng services
                service_name: service.service_name,  // Tên dịch vụ
                service_price,  // Giá dịch vụ từ body
                slot_service,   // Slot dịch vụ từ body
            },
            orderDate: order_time,
            status: "Pending"
        });

        await newOrder.save();

        const authCode = {
            message: "Order created successfully",
            order: newOrder,
            service_name: service.service_name,
            store_name: store.nameShop,
            service_price: service.service_price,
            date: order_time
        };

        res.status(201).json(authCode);  // Trả về authCode như là phản hồi

        // Gửi email với authCode
        await sendEmail(user.account.email, user.profile.name, authCode, actions.BOOKING_SERVICE);
        console.log(user.account.email + " Gửi mail thành công");

    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const changeStatusOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { status } = req.body;

        // Kiểm tra nếu 'status' không hợp lệ (thêm các giá trị status hợp lệ ở đây)
        const validStatuses = ['Pending', 'Completed', 'Cancelled']; // Thêm các giá trị hợp lệ cho status
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        // Tìm đơn hàng theo orderId
        const order = await ServiceOrders.findById(orderId);

        // Kiểm tra nếu không tìm thấy đơn hàng
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Cập nhật trạng thái
        order.status = status;
        await order.save();

        // Trả về thông tin chi tiết của đơn hàng sau khi cập nhật
        res.status(200).json({
            message: 'Order status updated successfully',
            order: {
                id: order._id,
                status: order.status,
                updatedAt: order.updatedAt, // Trả về thời gian cập nhật nếu cần
            }
        });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ message: 'Server Error' });
    }
}

const getNotificationByRoleUser = async (req, res) => {
    try {
        const userNotification = await ServiceOrders.find({ customerId: req.params.userId })
            .sort({ createdAt: -1 })
            .populate('storeId', 'nameShop address');

        res.status(200).json({
            message: "Bạn đã đặt thành công",
            orders: userNotification.map(order => ({
                id: order._id,                                           // Lấy id đơn hàng
                storeName: order.storeId ? order.storeId.nameShop : "",  // Lấy tên cửa hàng
                location: order.storeId ? order.storeId.address : "",   // Lấy địa chỉ cửa hàng
                services: order.services.map(service => ({
                    serviceName: service.service_name,                      // Lấy tên dịch vụ
                    price: service.service_price,                            // Lấy giá dịch vụ
                })),
                schedule: order.orderDate,                               // Lịch trình (ngày đặt)
                status: order.status,                                    // Trạng thái đơn hàng
            }))
        });


    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving notifications' });
    }
};

const getNotificationByRoleSupplier = async (req, res) => {
    try {
        const userNotification = await ServiceOrders.find({ storeId: req.params.storeId })
            .sort({ createdAt: -1 })
            .populate('customerId', 'profile.name account.email');

        res.status(200).json({
            message: "Bạn đã đặt nhận được thông báo đặt dịch vụ",
            orders: userNotification.map(order => ({
                orderId: order._id,
                userName: order.customerId ? order.customerId.profile.name : "",
                userMail: order.customerId ? order.customerId.account.email : "",
                services: order.services.map(service => ({
                    serviceId: service._id,
                    serviceName: service.service_name,
                    price: service.service_price,                            // Lấy giá dịch vụ
                })),
                schedule: order.orderDate,
                status: order.status,                           // Lịch trình (ngày đặt)
            }))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving notifications' });
    }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // 1. Kiểm tra đơn hàng có tồn tại không
    const order = await ServiceOrders.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 2. Kiểm tra store có thuộc user này không
    const store = await Store.findById(order.storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    // 3. Cập nhật trạng thái
    if (!["Pending", "Completed", "Cancelled", "Confirm"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    order.status = status;
    await order.save();

    res
      .status(200)
      .json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    let { userId, role } = req.query;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing userId or role in query",
      });
    }

    role = Number(role); // convert sang số để so sánh

    let orders = [];

    if (role === 3) {
      // Admin: tất cả đơn hàng
      orders = await ServiceOrders.find()
        .populate("storeId", "name ownerId")
        .populate("customerId", "profile.name profile.phone account.email");
    } else if (role === 2) {
      // Supplier: lấy tất cả đơn hàng của các store mình sở hữu
      const stores = await Store.find({ ownerId: userId }).select("_id");
      const storeIds = stores.map((s) => s._id);

      orders = await ServiceOrders.find({ storeId: { $in: storeIds } })
        .populate("storeId", "name")
        .populate("customerId", "profile.name profile.phone account.email");
    } else {
      // Customer: chỉ xem đơn hàng của mình
      orders = await ServiceOrders.find({ customerId: userId })
        .populate("storeId", "name")
        .populate("customerId", "profile.name profile.phone account.email");
    }

    return res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error getting orders:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getDetailOrder,
  getOrderByUserId,
  createServiceOrder,
  changeStatusOrder,
  getNotificationByRoleUser,
  createServiceOrderByServiceById,
  getNotificationByRoleSupplier,
  updateOrderStatus,
  getAllOrders,
};