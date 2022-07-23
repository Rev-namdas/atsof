require('dotenv').config()
const mongoose = require('mongoose')

const userLeaveSchema = new mongoose.Schema({
	user_id: { type: String, required: true },
	leave: [
		{
			leave_id: { type: Number, unique: true },
			leave_type: String,
			leave_balance: Number,
			leave_taken: Number
		}
	],
	leave_dates: [
		{
			date: Number,
			reason: String,
			leave_id: Number
		}
	]
}, {
	collection: 'leaves'
})

module.exports = mongoose.model('Leaves', userLeaveSchema)