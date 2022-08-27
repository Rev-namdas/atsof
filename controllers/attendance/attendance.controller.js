const UserDetails = require("../../models/UserDetails");
const Users = require("../../models/Users");
const moment = require("moment");
const { validateApiKey } = require("../../helpers/validateApiKey");
const { datesOfAMonth } = require("../../helpers/datesOfAMonth");
const { datesBetweenStartEndDate } = require("../../helpers/datesBetweenStartEndDate");

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
    const { user } = req.body;

    const match_aggregate = {
        "$unwind": "$attendance"
    }
    const unwind_aggregate = {
        "$match": {
            "$and": [
                { user_id: user.user_id },
                { "attendance.late": 1 }
            ]
        }
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
    const { user } = req.body

    const unwind = {
        "$unwind": "$attendance"
    }

    const match = {
        "$match": {
            "department_id": {
                $in: user?.dept_access
            }
        }
    }

    const attendances = await UserDetails
        .aggregate([unwind, match])
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

module.exports.monthly_attendance = async (req, res) => {
    const { user } = req.body

    const currentYear = moment().year()
    const currentMonth = moment().month() + 1
    const dates = datesOfAMonth(currentYear, currentMonth)
    const firstDate = dates[0].unix
    const lastDate = dates[dates.length - 1].unix

    const unwind = {
        "$unwind": "$attendance"
    }

    const match = {
        "$match": {
            "$and": [
                { "user_id": user.user_id },
                { "attendance.date": {
                    "$gte": firstDate,
                    "$lte": lastDate
                } 
                }
            ]
        }
    }

    const result = await UserDetails.aggregate([unwind, match])
        .then(result => result)
        .catch(err => {
            return {
                message: err.message,
                flag: "FAIL"
            }
        })

    const foundDates = result.map(each => each.attendance.date)
    
    const attendances = {}
    const logouts = {}
    /**
     * Find Month's Name By Date
     * 
     * @param {String} date  string date as this format DD-MM-YYYY
     * @returns Month's Name in String
     */
    const getMonth = (date) => {
        return moment(date, "DD-MM-YYYY").format("MMMM")
    }

    /**
     * Find Day's Of The Month By Date
     * 
     * @param {String} date string date as this format DD-MM-YYYY
     * @returns Month's Full Name in String
     */
    const getDay = (date) => {
        return moment(date, "DD-MM-YYYY").day()
    }

    result.map(each => {
        attendances[each.attendance.date] = each.attendance.login_time
        logouts[each.attendance.date] = each.attendance.logout_time
    })

    const alldates = dates.map(each => {
        if(foundDates.includes(each.unix)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: attendances[each.unix],
                logout_time: logouts[each.unix],
            }
        } if(user.dayoff[0] === getDay(each.date)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: 'Day Off',
                logout_time: "Day Off"
            }
        } if(user.leaves[getDay(each.date)].includes(each.unix)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: 'Leave',
                logout_time: "Leave"
            }
        } else {
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: "Absent",
                logout_time: "Absent"
            }
        }
    })

    res.send({
        attendances: alldates,
    })
}

module.exports.search_attendance_by_date = async (req, res) => {
    const { user, start_date, end_date } = req.body

    const isValid = validateApiKey({ start_date, end_date })

    if(!isValid){
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }

    const dates = datesBetweenStartEndDate(start_date, end_date)

    const firstDate = dates[0].unix
    const lastDate = dates[dates.length - 1].unix

    const unwind = {
        "$unwind": "$attendance"
    }

    const match = {
        "$match": {
            "$and": [
                { "user_id": user.user_id },
                { "attendance.date": {
                    "$gte": firstDate,
                    "$lte": lastDate
                } 
                }
            ]
        }
    }

    const result = await UserDetails.aggregate([unwind, match])
        .then(result => result)
        .catch(err => {
            return {
                message: err.message,
                flag: "FAIL"
            }
        })

    const foundDates = result.map(each => each.attendance.date)
    
    const attendances = {}
    const logouts = {}
    /**
     * Find Month's Name By Date
     * 
     * @param {String} date  string date as this format DD-MM-YYYY
     * @returns Month's Name in String
     */
    const getMonth = (date) => {
        return moment(date, "DD-MM-YYYY").format("MMMM")
    }

    /**
     * Find Day's Of The Month By Date
     * 
     * @param {String} date string date as this format DD-MM-YYYY
     * @returns Month's Full Name in String
     */
    const getDay = (date) => {
        return moment(date, "DD-MM-YYYY").day()
    }

    result.map(each => {
        attendances[each.attendance.date] = each.attendance.login_time
        logouts[each.attendance.date] = each.attendance.logout_time
    })

    const alldates = dates.map(each => {
        if(foundDates.includes(each.unix)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: attendances[each.unix],
                logout_time: logouts[each.unix],
            }
        } if(user.dayoff[0] === getDay(each.date)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: 'Day Off',
                logout_time: "Day Off"
            }
        } if(user.leaves[getDay(each.date)].includes(each.unix)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: 'Leave',
                logout_time: "Leave"
            }
        } else {
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: "Absent",
                logout_time: "Absent"
            }
        }
    })

    res.send({
        attendances: alldates,
    })
}