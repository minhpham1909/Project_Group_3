const mongoose = require("mongoose");

const FeedbacksSchema = new mongoose.Schema({
  starNumber: {
    type: Number,
    required: true,
    default: 1,
    enum: [1, 2, 3, 4, 5],
  },
  detail: {
    type: String,
    required: true,
    trim: true,
    maxLength: [500, "Feedback detail must not exceed 500 characters"],
    minLength: [5, "Feedback detail must be at least 5 characters"],
  },
  customerId: {
    type: mongoose.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  status: {
    type: Number,
    default: 1,
    enum: [1, 2, 3, 4, 5],
    required: true,
  },
},{
  timestamps: true
});

module.exports = mongoose.model("Feedbacks", FeedbacksSchema, "feedbacks");
