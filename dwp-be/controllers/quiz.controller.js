const quizModel = require("../models/quiz.model");
const questionModel = require("../models/question.model");
const axios = require("axios");
require("dotenv").config();

const createRandomQuestionInQuiz = async (req, res) => {
    try {
        const questionsRandom = await questionModel.aggregate([
            { $sample: { size: 6 } }
        ]);

        const newQuiz = new quizModel({
            title: req.body.title,
            description: req.body.description,
            userId: req.body.userId,
            categoryId: req.body.categoryId,
            questions: questionsRandom.map(q => ({
                questionId: q._id,
                answer: [],
            })),
        });

        await newQuiz.save();

        return res.status(201).json({
            message: 'Quiz đã được tạo thành công',
            quiz: newQuiz
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: 'Có lỗi xảy ra khi tạo quiz'
        });
    }
};

const getQuizById = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const quizTest = await quizModel.findById(quizId)
            .populate('questions.questionId', 'content options')  
            .populate('categoryId', 'categoryName')
            .exec();

        if (!quizTest) {
            return res.status(404).json({ message: "quizTest not found" });
        }
        res.status(200).json(quizTest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body;  
        const { quizId } = req.params;

        const quiz = await quizModel.findById(quizId).populate("questions.questionId").exec();
        if (!quiz) {
            return res.status(404).json({ message: "Quiz không tồn tại" });
        }

        const questionAndAnswer = quiz.questions.map(question => {
            const answer = answers.find(ans => ans.questionId.toString() === question.questionId._id.toString());
                    return {
                question: question.questionId.content, 
                answer: answer ? answer.answers : "Không có câu trả lời" 
            };
        });
        
        console.log("Câu hỏi và câu trả lời gửi đi từ Client:", questionAndAnswer);
        
        const feedbackFromAI = await commentAI(questionAndAnswer);

        quiz.questions.forEach((question) => {
            const answer = answers.find(ans => ans.questionId.toString() === question.questionId._id.toString());
            if (answer) {
                question.answers = answer.answers; 
            }
        });

        quiz.commentAI = feedbackFromAI;  
        console.log("Feedback từ AI - Response từ server:", feedbackFromAI);

        await quiz.save();

        return res.status(201).json({
            message: "Quiz đã được gửi thành công",
            quiz: quiz,  
            feedback: feedbackFromAI 
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Có lỗi xảy ra khi gửi quiz" });
    }
};

const commentAI = async (questionAndAnswer) => {
    try {
        console.log("Câu hỏi và câu trả lời gửi đi AI:", questionAndAnswer);

        const questionAnswerText = JSON.stringify(questionAndAnswer);
        const prompt = `Dưới đây là câu hỏi và câu trả lời của bài kiểm tra: ${questionAnswerText}.
        
        Dựa vào dữ liệu trên, hãy đưa ra:
        1. **Lời khuyên** về việc chăm sóc và cải thiện.
        2. **Phương pháp** cải thiện tình trạng .
        3. **Tiến trình phục hồi** dựa trên các câu trả lời.

        Lưu ý: Cung cấp lời khuyên, phương pháp và tiến trình phục hồi một cách chi tiết và có khoa học.`;

        const response = await fetch("https://api.yescale.io/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.API_KEY_GPT}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                max_tokens: 1000,
                temperature: 0.7,
            }),
        });

        if (!response.ok) throw new Error("Error fetching response from OpenAI API");

        // Nhận kết quả từ OpenAI API
        const data = await response.json();
        const aiMessage = data.choices[0].message.content.trim();

        console.log("Phản hồi từ OpenAI:", aiMessage);

        return aiMessage;

    } catch (error) {
        console.error("Error getting feedback from AI:", error);
        throw new Error("Không thể lấy phản hồi từ AI.");
    }
};

const getQuizByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        // Sắp xếp theo thời gian tạo quiz giảm dần
        const quizzes = await quizModel.find({ userId: userId })
            .sort({ createdAt: -1 })  // -1: giảm dần, 1: tăng dần
            .exec();

        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    getQuizById,
    createRandomQuestionInQuiz,
    submitQuiz,
    getQuizByUserId
}
