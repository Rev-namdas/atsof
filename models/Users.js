require('dotenv').config()
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
	user_id: { type: String, required: true },
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true, default: '1234' },
	role: [{ type: Number, required: false, default: process.env.USER }],
	dayoff: { type: Number, required: false, default: 0 },
	active: { type: Boolean, default: true },
	office_time: {
		0:	{ starts: String, ends: String },
		1:	{ starts: String, ends: String },
		2:	{ starts: String, ends: String },
		3:	{ starts: String, ends: String },
		4:	{ starts: String, ends: String },
		5:	{ starts: String, ends: String },
		6:	{ starts: String, ends: String }
	}
}, {
	collection: 'users'
})

module.exports = mongoose.model('Users', userSchema)