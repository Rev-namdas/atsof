const { leave_apply, pending_leaves, leave_approve, user_leave_status, leave_decline, leave_recommend } = require('../../controllers/leave/leave.controller')
const { isSuperAdmin } = require('../../helpers/isSuperAdmin')
const { isAdmin } = require('../../helpers/isAdmin')
const { get_id } = require('../../helpers/get_id')
const { check_client } = require('../../helpers/check_client')

const router = require('express').Router()

module.exports = (app) => {
	router.post('/apply', [check_client], leave_apply)
	router.get('/list/all', [isAdmin], pending_leaves)
	router.patch('/approve', [isSuperAdmin], leave_approve)
	router.patch('/decline', [isSuperAdmin], leave_decline)
	router.patch('/recommend', [isAdmin], leave_recommend)
	router.get('/status', [check_client], user_leave_status)
	
	app.use('/api/v1/user/leave', router)
	
	return app
}