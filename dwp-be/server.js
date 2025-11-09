const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const httpErrors = require("http-errors");
const getLocalIP = require("./utils/ipconfig");


const {
    AuthenticationRouter,
    UserRouter,
    QuestionRouter,
    QuizRouter,
    StoreRouter,
    ServiceOrderRouter
  } = require("./routes");

require('dotenv').config();
const app = express();

app.use(bodyParser.json());
app.use(morgan("dev"));

const db = require("./models");

app.use(express.json());

app.use("/auth", AuthenticationRouter);
app.use('/user', UserRouter);
app.use('/questions', QuestionRouter);
app.use('/quiz', QuizRouter);
app.use('/store', StoreRouter);
app.use('/service-orders', ServiceOrderRouter);

// Them middleware de kiem soat request sai yeu cau
app.use(async (req, res, next) => {
    next(httpErrors.BadRequest("Bad request"));
});

app.use(async (err, req, res, next) => {
    res.status = err.status;
    res.send({"error" : {"status": err.status, "message": err.message}});
})

app.listen(process.env.PORT, () => {
    console.log(`Server running at http://${process.env.HOST_NAME}:${process.env.PORT}`);
    const ip = getLocalIP();
    console.log(`IP Address: ${ip}`);
    db.connectDB();
});
  