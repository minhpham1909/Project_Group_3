const mongoose = require("mongoose");

const ServiceOrdersSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Types.ObjectId,
        ref: "Users",
        required: [true, "Customer ID is required."],
    },
    price: {
        type: Number,
        required: [true, "Total price is required."],
        default: 0,
    },
    storeId: {
        type: mongoose.Types.ObjectId,
        ref: "Stores",
        required: [true, "Store ID is required."],
    },
    services: [
        {
            serviceId: {
                type: mongoose.Types.ObjectId,
                ref: "Stores.services",
                required: [true, "Service ID is required."]
            },
            service_name: {
                type: String,
                required: [true, "Service name is required."]
            },
            service_price: {
                type: Number,
                required: [true, "Service price is required."]
            },
            slot_service: {
                type: Number,
                required: [true, "Duration of service is required."],
                min: [1, "Duration must be at least 1 minute."]
            }
        }
    ],
    orderDate: {
        type: Date,
        required: [true, "Order date is required."],
        validate: {
            validator: function(value) {
                return value >= new Date(); // Kiểm tra ngày đặt không phải trong quá khứ
            },
            message: "Order date cannot be in the past."
        }
    },
    status: {
        type: String,
        enum: {
            values: ["Completed", "Cancelled", "Pending"],
            message: "Status must be either 'Completed', 'Cancelled', or 'Pending'.",
        },
        default: "Pending",
        required: [true, "Status is required."],
    },
}, {
    timestamps: true
});

// Middleware trước khi save vào MongoDB để tính tổng price từ các dịch vụ
ServiceOrdersSchema.pre('save', function(next) {
    if (this.services && this.services.length > 0) {
        // Tính tổng giá trị của các dịch vụ
        this.price = this.services.reduce((total, service) => total + service.service_price, 0);
    }
    next();
});

module.exports = mongoose.model(
    "ServiceOrders",
    ServiceOrdersSchema,
    "service_orders"
);
