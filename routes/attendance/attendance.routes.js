const {
    fetch_details,
    save_attendance,
    save_logout_time,
    fetch_attendance_by_user_id,
    fetch_user_lates,
    fetch_attendance_by_dept,
} = require("../../controllers/attendance/attendance.controller");
const { isSuperAdmin } = require("../../helpers/isSuperAdmin");
const { isAdmin } = require("../../helpers/isAdmin");
const { check_client } = require("../../helpers/check_client");

const router = require("express").Router();

module.exports = (app) => {
    router.post("/save", save_attendance);
    router.post("/logout-time/save", save_logout_time);
    router.get("/list", [check_client], fetch_attendance_by_user_id);
    router.get("/list/all", [isSuperAdmin], fetch_details);
    router.get("/list/by-dept", [isAdmin], fetch_attendance_by_dept);
    router.get("/late", [check_client], fetch_user_lates);

    app.use("/api/v1/attendance", router);

    return app;
};
