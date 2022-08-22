const UserDetails = require("../../models/UserDetails");
const Users = require("../../models/Users");
const moment = require("moment");
const { validateApiKey } = require("../../helpers/validateApiKey");

module.exports.save_attendance = async (req, res) => {
    const { user_id, username, department_id, month, date, 
        login_time, logout_time } = req.body;

    const isValid = validateApiKey({ user_id, username, department_id, 
        month, date, login_time })

    if (!isValid) {
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL",
        });
    }
    
    const formData = {};

    formData.user_id = user_id;
    formData.username = username;
    formData.department_id = department_id;
    formData.attendance = {
        month: month,
        date: date,
        login_time: login_time,
        logout_time: logout_time || login_time,
        late: 0,
    };

    const today = new Date()
    const userOfficeTime = await Users.findOne({ user_id })
        .then((user) => {
            return user.office_time;
        })
        .catch(() => {
            return 0;
        });

    const officeTime = moment(userOfficeTime[today.getDay()].starts, "hh:mm A")
    const loginTime = moment(login_time, "hh:mm A")
    const checkLoginTime = loginTime.diff(officeTime, 'minutes')
    const graceTime = 5

    if(checkLoginTime > graceTime){
        formData.attendance.late = 1
    }

    const user_exist = await UserDetails.findOne({ user_id })
        .then((data) => {
            return data
        })
        .catch((err) => {
            return res.send({
                message: err.message,
                flag: "FAIL"
            })
        })

    if (!user_exist) {
        const done = new UserDetails(formData).save();

        if (done) {
            return res.send({
                message: `You are logged in at ${login_time}`,
                login_date: date,
                flag: "SUCCESS",
            });
        } else {
            return res.send({
                message: "Something went wrong",
                flag: "FAIL",
            });
        }
    }

    if (user_exist) {
        const filter = {}
        filter["user_id"] = user_id
        filter["attendance.month"] = month
        filter["attendance.date"] = date

        const date_exist = await UserDetails.findOne(filter)
            .then((data) => {
                return data
            })
            .catch((err) => {
                return res.send({
                    message: err.message,
                    flag: "FAIL"
                })
            })

        if (!date_exist) {
            user_exist.attendance.push(formData.attendance);
            user_exist.save();

            return res.send({
                message: `You have logged in at ${login_time}`,
                login_date: date,
                flag: "SUCCESS",
            });
        }

        if (date_exist) {
            date_exist.attendance.map((each) => {
                if (each.date === date) {
                    each.logout_time = login_time;
                }
            });

            const updated = date_exist.save();

            if (updated) {
                return res.send({
                    message: "Welcome back !",
                    login_date: date,
                    flag: "SUCCESS",
                });
            } else {
                return res.send({
                    message: "Something Wrong",
                    flag: "FAIL",
                });
            }
        }
    }
};

module.exports.save_logout_time = async (req, res) => {
    const { user_id, month, date, logout_time } = req.body;

    const isValid = validateApiKey({ user_id, month, date, logout_time })

    if (!isValid) {
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL",
        });
    }

    const filter = {}
    filter["user_id"] = user_id
    filter["attendance.month"] = month
    filter["attendance.date"] = date

    const date_exist = await UserDetails.findOne(filter)
        .then((data) => {
            return data
        })
        .catch((err) => {
            return res.send({
                message: err.message,
                flag: "FAIL"
            })
        })

    if (date_exist) {
        date_exist.attendance.map((each) => {
            if (each.date === date) {
                each.logout_time = logout_time;
            }
        });

        const updated = date_exist.save();

        if (updated) {
            return res.send({
                message: `You have logged out at ${logout_time}`,
                flag: "SUCCESS",
            });
        } else {
            return res.send({
                message: "Something Wrong",
                flag: "FAIL",
            });
        }
    } else {
        return res.send({
            message: "Check user id, month, date field !",
            flag: "FAIL",
        });
    }
};

module.exports.fetch_attendance_by_user_id = async (req, res) => {
    const { user } = req.body;

    const result = await UserDetails.findOne({ user_id: user.user_id })
        .then((data) => {
            return data
        })
        .catch(() => {
            return []
        })

    return res.send(result);
};

module.exports.fetch_details = async (req, res) => {
    const result = await UserDetails.find()
        .then((data) => {
            return data
        })
        .catch(() => {
            return []
        })

    return res.send(result);
};

module.exports.fetch_user_lates = async (req, res) => {
    const { user_id } = req.body;

    const isValid = validateApiKey({ user_id })

    if(!isValid){
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }

    const match_aggregate = {}
    const unwind_aggregate = {}

    unwind_aggregate["$unwind"] = "$attendance"
    match_aggregate["$match"] = {
        "$and": [
            { user_id: user_id },
            { "attendance.late": 1 }
        ]
    }
    
    const result = await UserDetails
        .aggregate([unwind_aggregate, match_aggregate])
        .then((data) => {
            return data
        })
        .catch(() => {
            return []
        })

    return res.send(result)
}

module.exports.fetch_attendance_by_dept = async (req, res) => {
    const { dept_ids } = req.body

    const isValid = validateApiKey({ dept_ids })

    if(!isValid || !Array.isArray(dept_ids)){
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }

    const filter = {}
    filter["department.id"] = {
        $in: dept_ids
    }

    const attendances = await UserDetails
        .aggregate([
            {
                $unwind: "$attendance"
            },
            {
                $match: {
                    "department.id": {
                        $in: dept_ids
                    }
                }
            }
        ])
        .then(res => {
            return res
        })
        .catch(err => {
            return res.send({
                message: err.message,
                flag: "FAIL"
            })
        })

    if(!attendances){
        return res.send({
            message: "Something went wrong",
            flag: "FAIL"
        })
    }

    return res.send({
        attendances: attendances,
        message: "Fetched Successfully",
        flag: "SUCCESS"
    })
}