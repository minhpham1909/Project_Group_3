const express = require("express");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.json());

const { QuestionController } = require("../controllers");

router.get("/all", QuestionController.getAllQuestions);

module.exports = router;


