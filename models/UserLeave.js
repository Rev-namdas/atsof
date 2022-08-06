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
			leave_id: Number,
			recommended: [String]
		}
	],
	pending_leaves: [
		{
			name: String,
			date: Number,
			from_date: Number,
			to_date: Number,
			dates: [Number],
			day: Number,
			reason: String,
			leave_id: Number,
			pending: Boolean,
			recommended: [String]
		}
	],
	pending_status: { type: Number, default: 0 }
}, {
	collection: 'leaves'
})

module.exports = mongoose.model('Leaves', userLeaveSchema)