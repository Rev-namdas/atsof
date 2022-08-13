const { fetch_details, save_attendance, save_logout_time, fetch_attendance_by_user_id } = require('../../controllers/attendance/attendance.controller');
const { validate_permission } = require("../../helpers/validate_permission");

const router = require('express').Router()

module.exports = (app) => {
	router.post("/list/all", [validate_permission], fetch_details);
    router.post("/save", save_attendance);
    router.post("/logout-time/save", save_logout_time);
    router.get("/list/:user_id", fetch_attendance_by_user_id);

	app.use("/api/v1/attendance", router);

    return app;
}