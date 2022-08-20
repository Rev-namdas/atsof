const { user_registration, user_login } = require('../../controllers/auth/auth.controller');
const { isSuperAdmin } = require('../../helpers/isSuperAdmin');

const router = require('express').Router()

module.exports = (app) => {
	router.post("/register", [isSuperAdmin], user_registration);
    router.post("/login", user_login);

	app.use("/api/v1/user/auth", router);

    return app;
}