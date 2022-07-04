require('dotenv').config()
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
	user_id: { type: String, required: true },
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true, default: '1234' },
	role: [{ type: Number, required: false, default: process.env.USER }],
	dayoff: { type: Number, required: false, default: 0 },
}, {
	collection: 'users'
})

module.exports = mongoose.model('Users', userSchema)