const { createGovtLeave, getGovtLeaves, assignGovtLeaves } = require('../../../controllers/settings-info/govt-leaves/govtleaves.controller')
const { isSuperAdmin } = require('../../../helpers/isSuperAdmin')

const router = require('express').Router()

module.exports = (app) => {
	router.post('/create', [isSuperAdmin], createGovtLeave)
	router.get('/fetch', [isSuperAdmin], getGovtLeaves)
	router.post('/assign', [isSuperAdmin], assignGovtLeaves)

	app.use('/api/v1/govt-leaves', router)
}