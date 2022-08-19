const { leave_apply, pending_leaves, leave_approve, user_leave_status, leave_decline } = require('../../controllers/leave/leave.controller')
const { check_permission } = require('../../helpers/check_permission')
const { get_id } = require('../../helpers/get_id')

const router = require('express').Router()

module.exports = (app) => {
	router.post('/apply', leave_apply)
	router.get('/list/all', [check_permission], pending_leaves)
	router.patch('/approve', [check_permission], leave_approve)
	router.patch('/decline', [check_permission], leave_decline)
	router.get('/status', [get_id], user_leave_status)
	
	app.use('/api/v1/user/leave', router)
	
	return app
}