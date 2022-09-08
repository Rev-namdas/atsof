const { validateApiKey } = require("../../helpers/validateApiKey");
const Departments = require("../../models/settings-info/Departments");
const Users = require("../../models/Users");
const moment = require("moment")

module.exports.account_status_change = async (req, res) => {
    const { user_id, account_status } = req.body;

    const isValid = validateApiKey({ user_id, account_status })

    if(!isValid){
        console.log(`❌ account.controller | 
            account_status_change: Invalid API Key`);
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }

    const filter = {}
    const docUpdate = {}

    filter["user_id"] = user_id
    docUpdate["$set"] = {
        active: account_status
    }

    const updated = await Users.updateOne(filter, docUpdate)
        .then((data) => {
            return data
        })
        .catch((err) => {
            console.log(`❌ account.controller | 
                account_status_change |
                updateOne: ${err.message}`);
            return res.send({
                message: "Something went wrong",
                flag: "FAIL"
            })
        })

    if (updated.matchedCount === 0) {
        console.log(`❌ account.controller | 
            account_status_change |
            matchedCount: User ID not exist!`);

        return res.send({
            message: "User ID not exist!",
            flag: "FAIL",
        });
    } else if (
        updated.matchedCount !== 0 &&
        updated.modifiedCount === 0
    ) {
        console.log(`❌ account.controller | 
            account_status_change |
            matchedCount: Doc Not Updated!`);

        return res.send({ message: "Doc Not Updated!", flag: "FAIL" });
    } else if (
        updated.matchedCount !== 0 &&
        updated.modifiedCount !== 0
    ) {
        return res.send({
            message: `User ${
                account_status ? "Activated" : "Deactivated"
            } !`,
            flag: "SUCCESS",
        });
    }
};

module.exports.fetch_users = async (req, res) => {
    const fields = {
        _id: 1,
        user_id: 1,
        username: 1,
        role: 1,
        department_id: 1,
        dept_access: 1,
        active: 1,
    };
    
    const result = await Users.find().select(fields)
        .then((data) => {
            return data
        })
        .catch((err) => {
            console.log(`❌ account.controller | fetch_users: ${err.message}`);
            return []
        })

    return res.send(result);
};

module.exports.fetch_user_informations = async (req, res) => {
    const { user } = req.body

    const departmentName = async (ids) => {
        const filter = {
            dept_id: {
                $in: ids
            }
        }
        const result = await Departments.find(filter)
            .then(result => result)
            .catch(err => {
                console.log(`❌ account.controller | 
                    fetch_user_information: ${err.message}`);
                return {
                    message: "Something went wrong",
                    flag: "FAIL"
                }
            })

        if(result.length === 1){
            return result[0].dept_name
        } else {
            return result.map(each => each.dept_name)
        }

    }

    const getOfficeTime = (time) => {
        const keys = Object.keys(time)
		const res = keys.map(each => {
			return {
				day: moment().day(each).format("dddd"),
				starts: time[each].starts,
				ends: time[each].ends
			}
		})
		
        return res
    }

    const output = {
        username: user.username,
        department: await departmentName([user.department_id]),
        dayoff: moment().day(user.dayoff[0]).format("dddd"),
        role: user.role[0],
        dept_access: await departmentName(user.dept_access),
        office_time: getOfficeTime(user.office_time)
    }

    return res.send(output)
}

module.exports.fetch_users_by_id = async (req, res) => {
    const { ids } = req.body
    
    const filter = {}
    filter["user_id"] = {
        $in: ids
    }
    
    const fields = {
        user_id: 1,
        username: 1,
        role: 1,
        active: 1,
        department: 1
    };
    
    const result = await Users.find(filter).select(fields)
        .then((data) => {
            return data
        })
        .catch((err) => {
            console.log(`❌ account.controller | 
                fetch_users_by_id: ${err.message}`);

            return []
        })

    return res.send(result);
};

module.exports.fetch_user_by_auth = async (req, res) => {
    const { user } = req.body
    
    const filter = {}
    filter["auth"] = user.auth
    
    const fields = {
        user_id: 1,
        username: 1,
        role: 1,
        active: 1,
        department: 1
    };
    
    const result = await Users.find(filter).select(fields)
        .then((data) => {
            return data
        })
        .catch(() => {
            return []
        })

    return res.send(result);
};

module.exports.fetch_users_by_dept = async (req, res) => {
    const { dept_ids } = req.body

	const isValid = validateApiKey({ dept_ids })

	if(!isValid){
        console.log(`❌ account.controller | 
            fetch_users_by_dept: Invalid API Key`);

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
                                console.log(`❌ account.controller | 
                                    fetch_users_by_dept: ${err.message}`);

								return res.send({
									message: "Something went wrong",
									flag: "FAIL"
								})
							})

    res.send(users)
}