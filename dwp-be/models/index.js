const mongoose = require("mongoose");
const user = require("./user.model");
const question = require("./question.model");
const category = require("./category.model");
const quiz = require("./quiz.model");
const dotenv = require("dotenv");
dotenv.config();

const db = {};

db.user = user;
db.question = question;
db.quiz = quiz;
db.category= category;

db.connectDB = async () => {
  try {
    await mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => console.log("Connect to MongoDB successfully!" + "and DBName:" + process.env.MONGODB_URI));
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = db;
