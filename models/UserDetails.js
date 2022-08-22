require('dotenv').config()
const mongoose = require('mongoose')

const userDetailsSchema = new mongoose.Schema({
	user_id: { type: String, required: true },
	username: String,
	department_id: Number,
	attendance: [
		{
			month: Number,
			date: Number,
			login_time: String,
			logout_time: String,
			late: { type: Number, default: 0 },
		}
	]
}, {
	collection: 'details'
})

module.exports = mongoose.model('UsersDetails', userDetailsSchema)