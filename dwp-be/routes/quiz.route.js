const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.json());

const { QuizController } = require("../controllers");

router.get("/:quizId", QuizController.getQuizById);
router.post("/createQuiz", QuizController.createRandomQuestionInQuiz);
router.post("/submit/:quizId", QuizController.submitQuiz);
router.get("/getQuizByUserId/:userId", QuizController.getQuizByUserId);

module.exports = router;


