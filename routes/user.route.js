const express = require("express");
const {
    user_registration,
    user_login,
	user_attendance,
    fetch_details,
    validate_permission,
    user_logout,
    fetch_attendance_by_user_id,
} = require("../controllers/user.controller");

const router = express.Router();

module.exports = (app) => {
    router.post("/register", [validate_permission], user_registration);
    router.post("/login", user_login);
    router.get("/attendance", fetch_details);
    router.post("/attendance", user_attendance);
    router.post("/attendance/logout", user_logout);
    router.get("/attendance/list/:user_id", fetch_attendance_by_user_id);

    app.use("/api/v1/user", router);

    return app;
};
