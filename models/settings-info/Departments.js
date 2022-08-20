const mongoose = require('mongoose')

const departmentSchema = new mongoose.Schema({
	dept_id: { type: Number, unique: true },
	dept_name: String
})

module.exports = mongoose.model('Departments', departmentSchema)