const { validateApiKey } = require("../../../helpers/validateApiKey")
const Holidays = require("../../../models/settings-info/Holidays")
const Users = require("../../../models/Users")
const moment = require("moment")

module.exports.createHoliday = async (req, res) => {
	const { leave_name, leave_date } = req.body	
	let leave_id

	const isValid = validateApiKey({ leave_name, leave_date })

	if(!isValid){
		return res.send({
			message: "API Key Invalid",
			flag: "FAIL"
		})
	}

	const leaveExist = await Holidays.countDocuments()

	if(leaveExist === 0){
		leave_id = 1
	} else {
		const lastLeave = await Holidays.findOne().sort({ "leave_id": -1 })
		leave_id = lastLeave.leave_id + 1
	}

	const newLeave = new Holidays({ leave_id, leave_name, leave_date })

	const output = await newLeave.save()
			.then(() => {
				return {
					message: "Created Successful",
					flag: "SUCCESS"
				}
			})
			.catch(err => {
				if(err.code === 11000){
					return {
						message: "This date is already assigned",
						flag: "WARNING"
					}
				}

				return {
					message: err.message,
					flag: "FAIL"
				}
			})

	res.send(output)
}

module.exports.getHolidays = async (req, res) => {
	const leaves = await Holidays.find()
							.then(res => {
								return {
									message: "Fetched Successfully",
									flag: "SUCCESS",
									leaves: res
								}
							})
							.catch(err => {
								return {
									message: err.message,
									flag: "FAIL",
									leaves: []
								}
							})

	res.send(leaves)
}

module.exports.assignHolidays = async (req, res) => {
	const { holidays, dept_id, user_ids } = req.body

	const isValid = validateApiKey({ holidays, dept_id, user_ids })

	if(!isValid){
		return res.send({
			message: "Invalid API Key",
			flag: "FAIL"
		})
	}

	const filter = {}
	let error_dates = []

	if(user_ids === 'All'){
		filter["department_id"] = dept_id
	} else {
		filter["user_id"] = { "$in": user_ids }
	}
	
	const users = await Users.find(filter)
							.then(result => result)
							.catch(err => {
								return res.send({
									message: err.message,
									flag: "FAIL"
								})
							})

	holidays.map(eachHoliday => {
		users.map(eachUser => {
			if(
				eachUser.leaves[moment(eachHoliday * 1000).day()]
				.includes(eachHoliday)
			){
				error_dates.push({ username: eachUser.username, holiday: eachHoliday })
			} else {
				eachUser.leaves[moment(eachHoliday * 1000).day()].push(eachHoliday)
				eachUser.save()
			}
		})
	})

	res.send({ users: users, error_dates: error_dates })
}