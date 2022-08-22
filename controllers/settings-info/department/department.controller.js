const { validateApiKey } = require("../../../helpers/validateApiKey")
const Departments = require("../../../models/settings-info/Departments")

module.exports.create_department = async (req, res) => {
	const { dept_name } = req.body
	
	const isValid = validateApiKey({ dept_name })

	if(!isValid){
		return res.send({
			message: "Invalid API Key",
			flag: "FAIL"
		})
	}

	const dept_exist = await Departments.findOne({ dept_name })
		.then(res => res)
		.catch(err => {
			return res.send({
				message: err.message,
				flag: "FAIL"
			})
		})

	if(dept_exist){
		return res.send({
			message: "Department Name Already Exist",
			flag: "FAIL"
		})
	}

	const exist = await Departments.findOne()
		.sort({ dept_id: -1 })
		.select({ dept_id: 1 })

	const newDept = new Departments({
		dept_id: exist ? (exist.dept_id + 1) : 1,
		dept_name: dept_name
	})

	newDept.save()

	return res.send({
		message: "Department Created Successfully",
		flag: "SUCCESS"
	})
}

module.exports.get_departments = async (req, res) => {
	try {
		const depts = await Departments.find().lean()

		return res.send({
			departments: depts,
			message: "Fetch Complete",
			flag: "SUCCESS"
		})
	} catch (error) {
		return res.send({
			departments: [],
			message: "Internal Error",
			flag: "FAIL"
		})
	}

}