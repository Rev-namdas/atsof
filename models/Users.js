require('dotenv').config()
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
	user_id: { type: String, required: true },
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true, default: '1234' },
	role: [{ type: Number, required: false, default: process.env.USER }],
	dayoff: [{ type: Number, required: false }],
	active: { type: Boolean, default: true },
	office_time: {
		0:	{ starts: String, ends: String },
		1:	{ starts: String, ends: String },
		2:	{ starts: String, ends: String },
		3:	{ starts: String, ends: String },
		4:	{ starts: String, ends: String },
		5:	{ starts: String, ends: String },
		6:	{ starts: String, ends: String }
	},
	leaves: {
		0:	[{ type: Number }],
		1:	[{ type: Number }],
		2:	[{ type: Number }],
		3:	[{ type: Number }],
		4:	[{ type: Number }],
		5:	[{ type: Number }],
		6:	[{ type: Number }]
	},
}, {
	collection: 'users'
})

module.exports = mongoose.model('Users', userSchema)