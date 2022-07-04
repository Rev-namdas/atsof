const express = require("express");
const {
    user_registration,
    user_login,
	user_attendance,
    fetch_details,
} = require("../controllers/user.controller");

const router = express.Router();

module.exports = (app) => {
    router.post("/register", user_registration);
    router.post("/login", user_login);
    router.post("/attendance", user_attendance);
    router.get("/attendance", fetch_details);

    app.use("/api/v1/user", router);

    return app;
};
