const { validateApiKey } = require("../../../helpers/validateApiKey")
const Holidays = require("../../../models/settings-info/Holidays")
const Users = require("../../../models/Users")
const moment = require("moment")
const { offDaysOfCurrentMonth } = require("../../../helpers/offDaysOfCurrentMonth")
const UserLeave = require("../../../models/UserLeave")

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
	const fields = {
		_id: 0,
		leave_id: 1,
		leave_name: 1,
		leave_date: 1
	}

	const leaves = await Holidays.find()
							.select(fields)
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
	const { holidays, dept_id, user_id } = req.body

	const isValid = validateApiKey({ holidays, dept_id, user_id })

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

	if(user_id === 'All'){
		filter["department_id"] = dept_id
	} else {
		filter["user_id"] = user_id
	}

	const userLeaves = await UserLeave.find(filter)
								.then(result => result)
								.catch(err => {
									console.log(`❌ holiday.controller | 
										assign_holidays |
										userLeaves: ${err.message}`);
									
									return res.send({
										message: "Something went wrong",
										flag: "FAIL"
									})
								})

	userLeaves.map(eachUser => {
		holidays.map(eachHoliday => {
			eachUser.holiday.push(eachHoliday)
		})
		eachUser.save()
	})
	
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

	users.map(eachUser => {
		holidays.map(eachHoliday => {
			if(
				eachUser.leaves[moment(eachHoliday.leave_date * 1000).day()]
				.includes(eachHoliday.leave_date)
			){
				error_dates.push({ username: eachUser.username, holiday: eachHoliday.leave_date })
			} else {
				eachUser.leaves[moment(eachHoliday.leave_date * 1000).day()].push(eachHoliday.leave_date)
			}
		})
		eachUser.save()
		assignedUsers.push(eachUser)
	})

	res.send({
		message: "Update Complete",
		flag: "SUCCESS",
		users: assignedUsers, 
		error_dates: error_dates
	})
}


/**
 * UNFINISHED: each user's different day off/holiday
 */
module.exports.fetch_holiday_details = async (req, res) => {
	const { selection, user_id, user_dayoff } = req.body

	const isValid = validateApiKey({ selection, user_id })

	if(!isValid){
		console.log(`❌ holiday.controller | fetch_holiday_details: Invalid API Key`);
		
		return res.send({
			message: "Invalid API Key",
			flag: "FAIL"
		})
	}
	
	let list = []
	const filter = {
		user_id: user_id,
		"holiday.taken": 0
	}
	
	const fields = {
		_id: 0,
		user_id: 1,
		holiday: 1
	}

	if(selection === 'day-off'){
		list = offDaysOfCurrentMonth(user_dayoff)
	} else if(selection === 'holiday'){
		list = await UserLeave.findOne(filter)
								.select(fields)
								.then(res => {
									const list = res.holiday.map(each => ({
										date: each.leave_date,
										label: `${moment.unix(each.leave_date)
												.format("DD-MMM-YYYY ddd")} - ${each.leave_name}`,
										details: each.leave_name
									}))
									return list
								})
								.catch(err => {
									console.log(`❌ holiday.controller | fetch_holiday_details | holidays: ${err.message}`);

									return []
								})
	} else {
		console.log(`❌ holiday.controller | fetch_holiday_details: Invalid Selection`);

		return res.send({
			message: "Invalid Request",
			flag: "FAIL",
			list: []
		})
	}

	res.send({
		message: "Fetch Complete",
		flag: "SUCCESS",
		list: list
	})
}

module.exports.request_holiday_exchange = async (req, res) => {
	const { user_id, date, details } = req.body

	const isValid = validateApiKey({ user_id, date, details })

	if(!isValid){
		console.log(`❌ holiday.controller | request_holiday_exchange: Invalid API Key`);
		
		return res.send({
			message: "Invalid API Key",
			flag: "FAIL"
		})
	}
	
	const filter = {
		user_id: user_id,
		applied_dates: {
			$nin: date
		}
	}
	
	const foundUser = await UserLeave.findOne(filter)
							.then(res => res)
							.catch(err => {
								console.log(`❌ holiday.controller | request_holiday_exchange: ${err.message}`);

								return res.send({
									message: "Something went wrong",
									flag: "FAIL"
								})
							})

	if(foundUser === null){
		console.log(`❌ holiday.controller | request_holiday_exchange | foundUser: Already Applied`);
		
		res.send({
			message: "Already Applied",
			flag: "FAIL"
		})
	} else {
		foundUser.applied_dates.push(date)
		foundUser.exchanged_dates.push({
			date: date,
			details: details,
			approved: 0 // status pending on apply
		})
	
		const result = await foundUser.save()
							.then(res => {
								if(res === null){
									console.log(`❌ holiday.controller | request_holiday_exchange | foundUser`);
	
									return res.send({
										message: "Something went wrong",
										flag: "FAIL"
									})
								}
	
								return {
									message: "Request Submitted",
									flag: "SUCCESS"
								}
							})
							.catch(err => {
								console.log(`❌ holiday.controller | request_holiday_exchange | foundUser: ${err.message}`);
	
								return {
									message: "Something went wrong",
									flag: "FAIL"
								}
							})
	
		res.send(result)
	}
}

module.exports.pending_exchange_list = async (req, res) => {
	const { user } = req.body

	const unwind = {
		"$unwind": "$exchanged_dates"
	}
	
	const match = {
		"$match": {
			"$and": [
				{ "department_id": { "$in": user.dept_access } },
				{ "exchanged_dates.approved": 0 }
			]
		}
	}

	const project = {
		"$project": {
			_id: 0,
			user_id: 1,
			username: 1,
			department_id: 1,
			exchanged_dates: 1
		}
	}

	const list = await UserLeave.aggregate([unwind, match, project])
								.then(res => res)
								.catch(err => {
									console.log(`❌ holiday.controller | pending_exhange_list | list: ${err.message}`);

									res.send({
										message: "Something went wrong",
										flag: "FAIL"
									})
								})

	res.send(list)
}

module.exports.approve_exchange_request = async (req, res) => {
	/**
	 * select user by user id & date to approve in UserLeave Model
	 * change approved 0 to 1
	 * add date to Users Model in allowed dates
	 */
	const { user_id, date, holiday_type } = req.body
	let saved

	const isValid = validateApiKey({ user_id, date, holiday_type })

	if(!isValid){
		console.log(`❌ holiday.controller | approve_exchange_request: Invalid API Key`);

		return res.send({
			message: "Invalid API Key",
			flag: "FAIL"
		})
	}

	const filter = {
		"user_id": user_id,
		"exchanged_dates.date": date,
		"exchanged_dates.approved": 0
	}

	const updateDoc = {
		"$inc": {
			"exchange_balance": 1
		},
		"$set": {
			"exchanged_dates.$.approved": 1
		}
	}

	const updated = await UserLeave.updateOne(filter, updateDoc)
							.then(updated => {
								if(updated.matchedCount !== 0 && updated.modifiedCount !== 0){
									return true
								} else {
									return false
								}
							})
							.catch(err => {
								console.log(`❌ holiday.controller | approve_exchange_request | UserLeave Update: ${err.message}`);
								
								return false
							})

	if(updated){
		const user = await Users.findOne({ user_id })	
									.then(res => res)
									.catch(err => {
										console.log(`❌ holiday.controller | approve_exchange_request | user: ${err.message}`);

										return res.send({
											message: "Something went wrong",
											flag: "FAIL"
										})
									})
		
		// Day Off Exchange Request
		if(holiday_type === 'Day-Off'){
			user.allowed_dates.push(date)
		} 
		// Holiday Exchange Request
		else if(holiday_type !== "") {
			user.leaves[moment.unix(date).day()] = user.leaves[moment.unix(date).day()].filter(each => each !== date)
		}

		saved = await user.save()
								.then(res => {
									if(res === null) return false

									return true
								})
								.catch(err => {
									console.log(`❌ holiday.controller | approve_exchange_request | saved: ${err.message}`);
									
									return res.send({
										message: "Something went wrong",
										flag: "FAIL"
									})
								})
	}

	if(saved){
		res.send({
			message: "Holiday Request Approved",
			flag: "SUCCESS"
		})
	} else {
		console.log(`❌ holiday.controller | approve_exchange_request | saved: Not Saved !`);

		res.send({
			message: "Something went wrong",
			flag: "FAIL"
		})
	}
}