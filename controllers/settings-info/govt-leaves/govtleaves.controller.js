const { validateApiKey } = require("../../../helpers/validateApiKey")
const GovtLeaves = require("../../../models/settings-info/GovtLeaves")
const Users = require("../../../models/Users")
const moment = require("moment")

module.exports.createGovtLeave = async (req, res) => {
	const { leave_name, leave_date } = req.body	
	let leave_id

	const isValid = validateApiKey({ leave_name, leave_date })

	if(!isValid){
		return res.send({
			message: "API Key Invalid",
			flag: "FAIL"
		})
	}

	const leaveExist = await GovtLeaves.countDocuments()

	if(leaveExist === 0){
		leave_id = 1
	} else {
		const lastLeave = await GovtLeaves.findOne().sort({ "leave_id": -1 })
		leave_id = lastLeave.leave_id + 1
	}

	const newLeave = new GovtLeaves({ leave_id, leave_name, leave_date })

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

module.exports.getGovtLeaves = async (req, res) => {
	const leaves = await GovtLeaves.find()
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

module.exports.assignGovtLeaves = async (req, res) => {
	const { dept_ids, leave_date } = req.body

	const isValid = validateApiKey({ dept_ids, leave_date })

	if(!isValid){
		return res.send({
			message: "Invalid API Key",
			flag: "FAIL"
		})
	}

	const filter = {
		"department_id": {
			"$in": dept_ids
		}
	}
	
	const users = await Users.find(filter)
							.then(result => result)
							.catch(err => {
								return res.send({
									message: err.message,
									flag: "FAIL"
								})
							})

	users.map(eachUser => {
		eachUser.leaves[moment(leave_date * 1000).day()].push(leave_date)
		eachUser.save()
	})

	res.send({ users: users })
}