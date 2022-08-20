const { create_department, get_departments } = require('../../../controllers/settings-info/department/department.controller')
const { isSuperAdmin } = require('../../../helpers/isSuperAdmin')

const router = require('express').Router()

module.exports = (app) => {
	router.post('/create', [isSuperAdmin], create_department)
	router.get('/list', [isSuperAdmin], get_departments)

	app.use('/api/v1/settings/department', router)
}