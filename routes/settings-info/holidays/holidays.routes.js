const { create_holiday, get_holidays, assign_holidays } = require('../../../controllers/settings-info/holidays/holidays.controller')
const { isSuperAdmin } = require('../../../helpers/isSuperAdmin')

const router = require('express').Router()

module.exports = (app) => {
	router.post('/create', [isSuperAdmin], create_holiday)
	router.get('/fetch', [isSuperAdmin], get_holidays)
	router.post('/assign', [isSuperAdmin], assign_holidays)

	app.use('/api/v1/holiday/', router)
}