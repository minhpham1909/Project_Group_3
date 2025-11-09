const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true,
    maxLength: [500, "Feedback detail must not exceed 500 characters"],
    minLength: [5, "Feedback detail must be at least 5 characters"],
    default: "All",
  },
  icon: {
    type: String,
    required: true,
  },
},{
  timestamps: true
});

module.exports = mongoose.model("Categories", CategorySchema, "categories");
