const { validateApiKey } = require("../../../helpers/validateApiKey")
const Holidays = require("../../../models/settings-info/Holidays")
const Users = require("../../../models/Users")
const moment = require("moment")

module.exports.create_holiday = async (req, res) => {
	const { leave_name, leave_date } = req.body	
	let leave_id

	const isValid = validateApiKey({ leave_name, leave_date })

	if(!isValid){
		console.log(`❌ holiday.controller | 
			create_holiday: API Key Invalid`);

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
					console.log(`❌ holiday.controller | 
						create_holiday: This date is already assigned`);

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

module.exports.get_holidays = async (req, res) => {
	const leaves = await Holidays.find()
							.then(res => {
								return {
									message: "Fetched Successfully",
									flag: "SUCCESS",
									leaves: res
								}
							})
							.catch(err => {
								console.log(`❌ holiday.controller | 
									get_holidays: ${err.message}`);

								return {
									message: "Something went wrong",
									flag: "FAIL",
									leaves: []
								}
							})

	res.send(leaves)
}

module.exports.assign_holidays = async (req, res) => {
	const { holidays, dept_id, user_ids } = req.body

	const isValid = validateApiKey({ holidays, dept_id, user_ids })

	if(!isValid){
		console.log(`❌ holiday.controller | 
			assing_holidays: Invalid API Key`);

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
								console.log(`❌ holiday.controller | 
									assign_holidays |
									users: ${err.message}`);
								
								return res.send({
									message: "Something went wrong",
									flag: "FAIL"
								})
							})

	let assignedUsers = []

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
				assignedUsers.push(eachUser)
			}
		})
	})

	res.send({
		message: "Update Complete",
		flag: "SUCCESS",
		users: assignedUsers, 
		error_dates: error_dates
	})
}