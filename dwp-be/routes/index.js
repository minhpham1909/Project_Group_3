const AuthenticationRouter = require("./authen.route");
const UserRouter = require("./user.route");
const QuestionRouter = require("./question.route");
const QuizRouter = require("./quiz.route");
const StoreRouter = require("./store.route");
const ServiceOrderRouter = require("./service_order.route");

module.exports = {
    AuthenticationRouter,
    UserRouter,
    QuestionRouter,
    QuizRouter,
    StoreRouter,
    ServiceOrderRouter
};
