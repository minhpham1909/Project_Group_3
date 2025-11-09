const categoryModel = require("../models/category.model");

const getAllCatogory = async (req, res) => {
    try {
        const users = await categoryModel.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllCatogory
}
