const mongoose = require('mongoose')

const settingsInfoSchema = new mongoose.Schema({
	info_id: Number,
	departments: [{ id: Number, name: String }],
	dept_id_count: { type: Number, default: 0 },
	roles: [{ id: Number, name: String }],
	// leave_policies: [{
	// 	id: Number, 
	// 	name: String, 
	// 	casual: Number,
	// 	sick: Number,
	// 	annual: Number,
	// 	govt: Number,
	// }],
	// in userSchema leaves of array need to be array of objects
	// ex: 0: [{ date:  }]
})

module.exports = mongoose.model('SettingsInfo', settingsInfoSchema)