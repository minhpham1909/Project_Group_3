const mongoose = require("mongoose");

const StoresSchema = new mongoose.Schema({
  nameShop: {
    type: String,
    required: true,
    trim: true,
    maxLength: [100, "Field name must not exceed 100 characters"],
    minLength: [3, "Field name must be at least 3 characters"],
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxLength: [100, "Address must not exceed 100 characters"],
    minLength: [3, "Address must be at least 3 characters"],
  },
  ownerId: {
    type: mongoose.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  services: [
    {
      service_name: {
        type: String,
        required: true,
        trim: true,
        maxLength: [100, "Service name must not exceed 100 characters"],
        minLength: [3, "Service name must be at least 3 characters"]
      },
      service_price: {
        type: Number,
        required: true,
        min: [0, "Price must be greater than or equal to 0"]
      },
      slot_service: {
        type: Number,
        required: true,
        min: [1, "Duration must be at least 1 minute"]
      }
    }
  ],
  feedBackId: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Feedbacks",
    },
  ],
  image: [
    {
      type: String,
      required: true,
    },
  ],
  status: {
    type: String,
    default: "ACTIVE",
    enum: ["ACTIVE", "INACTIVE"],
    required: true,
  },
},{
  timestamps: true
});

module.exports = mongoose.model("Stores", StoresSchema, "stores");
