const mongoose = require('mongoose')

const GovtLeavesSchema = new mongoose.Schema({
	leave_id: Number,
	leave_name: String,
	leave_date: { type: Number, unique: true }
},{
	collection: "GovtLeaves"
})

module.exports = mongoose.model('GovtLeaves', GovtLeavesSchema)