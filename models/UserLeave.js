require('dotenv').config()
const mongoose = require('mongoose')

const userLeaveSchema = new mongoose.Schema({
	user_id: { type: String, required: true },
	username: String,
	leave: [
		{
			leave_id: Number,
			leave_type: String,
			leave_balance: Number,
			leave_taken: { type: Number, default: 0 }
		}
	],
	leave_dates: [
		{
			from_date: Number,
			to_date: Number,
			taken_dates: [{ day: Number, date: Number }],
			leave_count: Number,
			leave_id: Number,
			reason: String,
			approved: Number, // 0 = pending, 1 = approved, -1 = declined  
			recommended: [String],
			declined: [String]
		}
	],
	applied_dates: [Number],
	pending_status: { type: Number, default: 0 }
}, {
	collection: 'leaves'
})

module.exports = mongoose.model('Leaves', userLeaveSchema)