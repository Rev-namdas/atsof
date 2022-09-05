const { createHoliday, getHolidays, assignHolidays } = require('../../../controllers/settings-info/holidays/holidays.controller')
const { isSuperAdmin } = require('../../../helpers/isSuperAdmin')

const router = require('express').Router()

module.exports = (app) => {
	router.post('/create', [isSuperAdmin], createHoliday)
	router.get('/fetch', [isSuperAdmin], getHolidays)
	router.post('/assign', [isSuperAdmin], assignHolidays)

	app.use('/api/v1/holiday/', router)
}