const { leave_apply, pending_leaves, leave_approve, user_leave_status } = require('../../controllers/leave/leave.controller')
const { validate_permission } = require('../../helpers/validate_permission')

const router = require('express').Router()

module.exports = (app) => {
	router.post('/apply', leave_apply)
	router.post('/list/all', [validate_permission], pending_leaves)
	router.post('/approve', [validate_permission], leave_approve)
	router.get('/status/:id', user_leave_status)
	
	app.use('/api/v1/user/leave', router)
	
	return app
}