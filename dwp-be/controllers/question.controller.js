const questionModel = require("../models/question.model");

const getAllQuestions = async (req, res) => {
    try {
        const users = await questionModel.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllQuestions
}
