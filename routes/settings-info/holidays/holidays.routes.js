const { create_holiday, get_holidays, assign_holidays, fetch_holiday_details, request_holiday_exchange, pending_exchange_list } = require('../../../controllers/settings-info/holidays/holidays.controller')
const { isAdmin } = require("../../../helpers/isAdmin")
const { isSuperAdmin } = require('../../../helpers/isSuperAdmin')
const { check_client } = require('../../../helpers/check_client')

const router = require('express').Router()

module.exports = (app) => {
	router.post('/create', [isSuperAdmin], create_holiday)
	router.get('/fetch', [isSuperAdmin], get_holidays)
	router.post('/assign', [isSuperAdmin], assign_holidays)
	router.post('/list/fetch', [check_client], fetch_holiday_details)
	router.post('/exchange-request', [check_client], request_holiday_exchange)
	router.get('/pending/exchange-request', [isAdmin], pending_exchange_list)

	app.use('/api/v1/holiday', router)
}