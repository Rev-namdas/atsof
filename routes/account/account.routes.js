const router = require("express").Router();

const { fetch_users, account_status_change, fetch_users_by_id, fetch_user_informations } = require("../../controllers/account/account.controller");
const { check_client } = require("../../helpers/check_client");
const { isSuperAdmin } = require("../../helpers/isSuperAdmin");

module.exports = (app) => {
    router.get("/list", [isSuperAdmin], fetch_users);
    router.get("/details", [check_client], fetch_user_informations);
    router.patch("/change-account-status", [isSuperAdmin], account_status_change);
    router.post("/users-by-id", [isSuperAdmin], fetch_users_by_id);
    
    app.use("/api/v1/account", router);

    return app;
};
