const router = require("express").Router();

const { fetch_users, account_status_change } = require("../../controllers/account/account.controller");
const { check_permission } = require("../../helpers/check_permission");

module.exports = (app) => {
    router.get("/list", [check_permission], fetch_users);
    router.patch("/change-account-status", [check_permission], account_status_change);
    
    app.use("/api/v1/account", router);

    return app;
};
