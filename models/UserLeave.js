require('dotenv').config()
const mongoose = require('mongoose')

const userLeaveSchema = new mongoose.Schema({
	user_id: { type: String, required: true },
	leave: [
		{
			leave_id: Number,
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
	],
	pending_leaves: [
		{
			name: String,
			date: Number,
			day: Number,
			reason: String,
			leave_id: Number,
			pending: Boolean,
			recommended: [String]
		}
	],
	pending_status: Number
}, {
	collection: 'leaves'
})

module.exports = mongoose.model('Leaves', userLeaveSchema)