const { leave_apply } = require('../../controllers/leave/leave.controller')

const router = require('express').Router()

module.exports = (app) => {
	router.post('/apply', leave_apply)
	
	app.use('/api/v1/user/leave', router)
	
	return app
}