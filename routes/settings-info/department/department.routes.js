const { create_department, get_departments, delete_department_by_dept_id } = require('../../../controllers/settings-info/department/department.controller')
const { isAdmin } = require('../../../helpers/isAdmin')
const { isSuperAdmin } = require('../../../helpers/isSuperAdmin')

const router = require('express').Router()

module.exports = (app) => {
	router.post('/create', [isSuperAdmin], create_department)
	router.get('/list', [isAdmin], get_departments)
	router.delete('/delete/:dept_id', [isSuperAdmin], delete_department_by_dept_id)

	app.use('/api/v1/settings/department', router)
}