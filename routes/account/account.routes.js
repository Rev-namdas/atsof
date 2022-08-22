const router = require("express").Router();

const { fetch_users, account_status_change, fetch_users_by_id } = require("../../controllers/account/account.controller");
const { isSuperAdmin } = require("../../helpers/isSuperAdmin");

module.exports = (app) => {
    router.get("/list", [isSuperAdmin], fetch_users);
    router.patch("/change-account-status", [isSuperAdmin], account_status_change);
    router.post("/users-by-id", [isSuperAdmin], fetch_users_by_id);
    
    app.use("/api/v1/account", router);

    return app;
};
