const { user_registration, user_login } = require('../../controllers/auth/auth.controller');
const { check_permission } = require('../../helpers/check_permission');

const router = require('express').Router()

module.exports = (app) => {
	router.post("/register", [check_permission], user_registration);
    router.post("/login", user_login);

	app.use("/api/v1/user/auth", router);

    return app;
}