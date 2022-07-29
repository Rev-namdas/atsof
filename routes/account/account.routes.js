const router = require("express").Router();

const { fetch_users, account_status_change } = require("../../controllers/account/account.controller");
const { validate_permission } = require("../../helpers/validate_permission");

module.exports = (app) => {
    router.post("/list", [validate_permission], fetch_users);
    router.post("/change-account-status", [validate_permission], account_status_change);
    
    app.use("/api/v1/account", router);

    return app;
};
