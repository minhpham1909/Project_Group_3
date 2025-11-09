const mongoose = require("mongoose");

const QuestionsSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    urlQuestion: {
        type: String,
    },
    type: {
        type: String,
        required: true,
        enum: ["multiple-choice", "text"],
    },
    categoryId: {
        type: mongoose.Types.ObjectId,
        ref: "Categories",
        required: true
    },
    options: [String], // Các đáp án cho câu hỏi
    levelQuestion: {
        type: String,
        required: true,
        enum: ["Common", "Standard", "Premium"],
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("Questions", QuestionsSchema, "questions");
