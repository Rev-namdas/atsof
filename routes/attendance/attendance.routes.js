const {
    fetch_details,
    save_attendance,
    save_logout_time,
    fetch_attendance_by_user_id,
    fetch_user_lates,
    fetch_attendance_by_dept,
} = require("../../controllers/attendance/attendance.controller");
const { get_id } = require("../../helpers/get_id");
const { isSuperAdmin } = require("../../helpers/isSuperAdmin");
const { isAdmin } = require("../../helpers/isAdmin");

const router = require("express").Router();

module.exports = (app) => {
    router.get("/list/all", [isSuperAdmin], fetch_details);
    router.post("/list/by/dept", [isAdmin], fetch_attendance_by_dept);
    router.post("/save", save_attendance);
    router.post("/logout-time/save", save_logout_time);
    router.get("/list", [get_id], fetch_attendance_by_user_id);
    router.get("/late", [get_id], fetch_user_lates);

    app.use("/api/v1/attendance", router);

    return app;
};
