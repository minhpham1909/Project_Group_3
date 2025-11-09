const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    userId:{
        type: mongoose.Types.ObjectId,
        ref: "Users",
    },
    description: {
        type: String,
        required: true,
    },
    categoryId: {
        type: mongoose.Types.ObjectId,
        ref: "Categories",
        default: new mongoose.Types.ObjectId("605c72ef0f1b2c001f92a3e0"),
    },
    questions: [
        {
            _id: false,
            questionId: {
                type: mongoose.Types.ObjectId,
                ref: "Questions",
                required: true
            },
            answers: { type: [String] }, // Đảm bảo lưu đúng các đáp án
        }
    ],
    commentAI: {
        type: String,
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: "Users",
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("Quizzes", QuizSchema, "quizzes");

