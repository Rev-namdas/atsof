const { validateApiKey } = require("../../../helpers/validateApiKey")
const Departments = require("../../../models/settings-info/Departments")

module.exports.create_department = async (req, res) => {
	const { dept_name } = req.body
	
	const isValid = validateApiKey({ dept_name })

	if(!isValid){
		console.log(`❌ department.controller | 
			create_department Invalid API Key`);

		return res.send({
			message: "Invalid API Key",
			flag: "FAIL"
		})
	}

	const dept_exist = await Departments.findOne({ dept_name })
		.then(res => res)
		.catch(err => {
			console.log(`❌ department.controller | 
                create_department |
                dept_exist: ${err.message}`);

			return res.send({
				message: "Something went wrong",
				flag: "FAIL"
			})
		})

	if(dept_exist){
		console.log(`❌ department.controller | 
			create_department |
			dept_exist: Department name already exist`);

		return res.send({
			message: "Department Name Already Exist",
			flag: "FAIL"
		})
	}

	const exist = await Departments.findOne()
		.sort({ dept_id: -1 })
		.select({ dept_id: 1 })
		.then(res => res)
		.catch(err => {
			console.log(`❌ department.controller | 
                create_department |
                department exist: ${err.message}`);

			return res.send({
				message: "Something went wrong",
				flag: "FAIL"
			})
		})

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
		console.log(`❌ department.controller | 
			get_departments: ${err.message}`);

		return res.send({
			departments: [],
			message: "Something went wrong",
			flag: "FAIL"
		})
	}

}

module.exports.delete_department_by_dept_id = async (req, res) => {
	const { dept_id } = req.params

	const result = await Departments.findOneAndDelete({ dept_id })
						.then(res => {
							if(res === null){
								console.log(`❌ department.controller | 
									delete_department_by_dept_id
									: Department Not Found`);

								return {
									message: "Department Not Found",
									flag: "FAIL"
								}
							}

							return {
								message: "Removed Successfully",
								flag: "SUCCESS"
							}
						})
						.catch(err => {
							console.log(`❌ department.controller | 
								delete_department_by_dept_id: ${err.message}`);

							return {
								message: "Something went wrong",
								flag: "FAIL"
							}
						})

	res.send(result)
}