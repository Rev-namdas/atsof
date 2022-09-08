const UserDetails = require("../../models/UserDetails");
const Users = require("../../models/Users");
const moment = require("moment");
const { validateApiKey } = require("../../helpers/validateApiKey");
const { datesBetweenStartEndDate } = require("../../helpers/datesBetweenStartEndDate");
const { datesOfAMonthByCurrentDate } = require("../../helpers/datesOfAMonthByCurrentDate");
const Departments = require("../../models/settings-info/Departments");
const Holidays = require("../../models/settings-info/Holidays");

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
 * Find Month's Name By Date
 * 
 * @param {Number} unix unix timestamp
 * @returns Month's Name in String
 */
const getMonthByUnix = (unix) => {
    return moment(unix * 1000).format("MMMM")
}

/**
 * Find Month Name By Month Serial No
 * 
 * 
 * @param {Number} number month's serial number
 * @returns Month Name
 */
const getMonthByNo = (number) => {
    return moment(number, "MM").format("MMMM")
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

/**
 * Find Day's Of The Month By Date
 * 
 * @param {Number} unix unix date timestamp
 * @returns Month's Full Name in String
 */
const getDayByUnix = (unix) => {
    return moment(unix * 1000).day()
}

/**
 * Find Date By Unix Timestamp
 * 
 * @param {Number} unix unix date timestamp
 * @returns Date String
 */
const getDateByUnix = (unix) => {
    return moment(unix * 1000).format("DD-MM-YYYY")
}

/**
 * Find Department Name By Id
 * 
 * @param {Number} id department id in number
 * @param {Array} departments array of departments
 * @returns Department Name as String
 */
const getDepartmentName = (id, departments) => {
    return departments.find(each => each.dept_id === id).dept_name
}

const getGovtLeaveName = (date, leaves) => {
    return leaves.find(each => each.leave_date === date).leave_name
}

module.exports.save_attendance = async (req, res) => {
    const { user_id, username, department_id, month, date, 
        login_time, logout_time } = req.body;

    const isValid = validateApiKey({ user_id, username, department_id, 
        month, date, login_time })

    if (!isValid) {
        console.log(`❌ attendence.controller | 
            save_attendance: Invalid API Key`);

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
        .catch((err) => {
            console.log(`❌ attendance.controller | 
                save_attendance |
                userOfficeTime: ${err.message}`);

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
            console.log(`❌ attendance.controller | 
                save_attendance |
                user_exist: ${err.message}`);

            return res.send({
                message: "Something went wrong",
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
            console.log(`❌ attendance.controller | 
                save_attendance |
                done: Something went wrong`);

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
                console.log(`❌ attendance.controller | 
                    save_attendance |
                    date_exist: ${err.message}`);

                return res.send({
                    message: "Something went wrong",
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
                console.log(`❌ attendance.controller | 
                    save_attendance |
                    updated: Something went wrong`);

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
        console.log(`❌ attendance.controller | 
                save_logout_time: Invalid API Key`);

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
            console.log(`❌ attendance.controller | 
                save_logout_time |
                date_exist: ${err.message}`);

            return res.send({
                message: "Something went wrong",
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
            console.log(`❌ attendance.controller | 
                save_logout_time |
                updated: Something went wrong`);

            return res.send({
                message: "Something Wrong",
                flag: "FAIL",
            });
        }
    } else {
        console.log(`❌ attendance.controller | 
                save_logout_time |
                date_exist: Check user id, month, date field`);

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
        .catch((err) => {
            console.log(`❌ attendance.controller | 
                fetch_attendance_by_user_id |
                result: ${err.message}`);

            return []
        })

    return res.send(result);
};

module.exports.fetch_details = async (req, res) => {
    const result = await UserDetails.find()
        .then((data) => {
            return data
        })
        .catch((err) => {
            console.log(`❌ attendance.controller | 
                fetch_details: ${err.message}`);

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
        .catch((err) => {
            console.log(`❌ attendance.controller | 
                fetch_user_lates |
                result: ${err.message}`);

            return []
        })

    return res.send(result)
}

module.exports.fetch_attendance_by_dept_access = async (req, res) => {
    const { user } = req.body
    const today = moment().startOf('day').unix()

    const filter = {
        "department_id": {
            "$in": user.dept_access
        }
    }
    const field = {
        username: 1,
        department_id: 1,
        dayoff: 1,
        leaves: 1
    }

    const users = await Users.find(filter)
        .select(field)
        .then(result => result)
        .catch(err => {
            console.log(`❌ attendance.controller | 
                fetch_attendance_by_dept_access |
                users: ${err.message}`);

            return {
                message: "Something went wrong",
                flag: "FAIL"
            }
        })

    if(!users){
        console.log(`❌ attendance.controller | 
                fetch_attendance_by_dept_access |
                !users: Something went wrong`);

        return {
            message: "Something went wrong",
            flag: "FAIL"
        }
    }

    const unwind = {
        "$unwind": "$attendance"
    }

    const match = {
        "$match": {
            "$and": [
                {
                    "department_id": {
                        $in: user?.dept_access
                    }
                },
                {
                    "attendance.date": {
                        "$gte": today,
                        "$lte": today
                    }
                }
            ]
        }
    }

    const attendances = await UserDetails
        .aggregate([unwind, match])
        .then(res => {
            return res
        })
        .catch(err => {
            console.log(`❌ attendance.controller | 
                fetch_attendance_by_dept_access |
                attendances: ${err.message}`);

            return res.send({
                message: "Something went wrong",
                flag: "FAIL"
            })
        })

    if(!attendances){
        console.log(`❌ attendance.controller | 
            fetch_attendance_by_dept_access |
            !attendances: Something went wrong`);

        return res.send({
            message: "Something went wrong",
            flag: "FAIL"
        })
    }

    const departments = await Departments.find()
        .then(result => result)
        .catch(err => {
            console.log(`❌ attendance.controller | 
                fetch_attendance_by_dept_access |
                departments: ${err.message}`);

            return res.send({
                message: "Something went wrong",
                flag: "FAIL"
            })
        })

    const govtLeaves = await Holidays.find()
        .then(result => result)
        .catch(err => {
            console.log(`❌ attendance.controller | 
                fetch_attendance_by_dept_access |
                govtLeaves: ${err.message}`);

            return res.send({
                message: "Something went wrong",
                flag: "FAIL"
            })
        })

    const presentUsersUsername = new Set(attendances.map(each => each.username))

    const result = users.map(eachUser => {
        const departmentName = getDepartmentName(eachUser.department_id, departments)
        const monthName = getMonthByUnix(today)
        const stringDate = getDateByUnix(today)

        if(presentUsersUsername.has(eachUser.username)){
            const userATInfo = attendances.find(each => each.username === eachUser.username)
            
            return {
                username: userATInfo.username,
                department: getDepartmentName(userATInfo.department_id, departments),
                month: getMonthByNo(userATInfo.attendance.month),
                date: getDateByUnix(userATInfo.attendance.date),
                login_time: userATInfo.attendance.login_time,
                logout_time: userATInfo.attendance.logout_time, 
                late: userATInfo.attendance.late
            }
        } else if(eachUser.dayoff[0] === getDayByUnix(today)){
            return {
                username: eachUser.username,
                department: departmentName,
                month: monthName,
                date: stringDate,
                login_time: "Day Off",
                logout_time: "Day Off",
                late: 0
            }
        } else if(eachUser.leaves[getDayByUnix(today)].includes(today)){
            return {
                username: eachUser.username,
                department: departmentName,
                month: monthName,
                date: stringDate,
                login_time: getGovtLeaveName(today, govtLeaves) || "Leave",
                logout_time: 
                    (getGovtLeaveName(today, govtLeaves) && "Holiday") 
                    || "Leave",
                late: 0
            }
        } else {
            return {
                username: eachUser.username,
                department: departmentName,
                month: monthName,
                date: stringDate,
                login_time: "Absent",
                logout_time: "Absent",
                late: 0 
            }
        }
    })

    return res.send({
        attendances: result,
        message: "Fetched Successfully",
        flag: "SUCCESS"
    })
}

module.exports.search_attendance_by_dept_access = async (req, res) => {
    const { user, date } = req.body

    const filter = {
        "department_id": {
            "$in": user.dept_access
        }
    }
    const field = {
        username: 1,
        department_id: 1,
        dayoff: 1,
        leaves: 1
    }

    const users = await Users.find(filter)
        .select(field)
        .then(result => result)
        .catch(err => {
            console.log(`❌ attendance.controller | 
                search_attendance_by_dept_access |
                users: ${err.message}`);

            return {
                message: "Something went wrong",
                flag: "FAIL"
            }
        })

    if(!users){
        console.log(`❌ attendance.controller | 
                search_attendance_by_dept_access |
                !users: Something went wrong`);

        return {
            message: "Something went wrong",
            flag: "FAIL"
        }
    }

    const unwind = {
        "$unwind": "$attendance"
    }

    const match = {
        "$match": {
            "$and": [
                {
                    "department_id": {
                        $in: user?.dept_access
                    }
                },
                {
                    "attendance.date": {
                        "$gte": date,
                        "$lte": date
                    }
                }
            ]
        }
    }

    const attendances = await UserDetails
        .aggregate([unwind, match])
        .then(res => {
            return res
        })
        .catch(err => {
            console.log(`❌ attendance.controller | 
                search_attendance_by_dept_access |
                attendances: ${err.message}`);

            return res.send({
                message: "Something went wrong",
                flag: "FAIL"
            })
        })

    if(!attendances){
        console.log(`❌ attendance.controller | 
                search_attendance_by_dept_access |
                !attendances: Something went wrong`);

        return res.send({
            message: "Something went wrong",
            flag: "FAIL"
        })
    }

    const departments = await Departments.find()
        .then(result => result)
        .catch(err => {
            console.log(`❌ attendance.controller | 
                search_attendance_by_dept_access |
                departments: ${err.message}`);

            return res.send({
                message: "Something went wrong",
                flag: "FAIL"
            })
        })

    const presentUsersUsername = new Set(attendances.map(each => each.username))

    const result = users.map(eachUser => {
        const departmentName = getDepartmentName(eachUser.department_id, departments)
        const monthName = getMonthByUnix(date)
        const stringDate = getDateByUnix(date)

        if(presentUsersUsername.has(eachUser.username)){
            const userATInfo = attendances.find(each => each.username === eachUser.username)
            
            return {
                username: userATInfo.username,
                department: getDepartmentName(userATInfo.department_id, departments),
                month: getMonthByNo(userATInfo.attendance.month),
                date: getDateByUnix(userATInfo.attendance.date),
                login_time: userATInfo.attendance.login_time,
                logout_time: userATInfo.attendance.logout_time, 
                late: userATInfo.attendance.late
            }
        } else if(eachUser.dayoff[0] === getDayByUnix(date)){
            return {
                username: eachUser.username,
                department: departmentName,
                month: monthName,
                date: stringDate,
                login_time: "Day Off",
                logout_time: "Day Off",
                late: 0
            }
        } else if(eachUser.leaves[getDayByUnix(date)].includes(date)){
            return {
                username: eachUser.username,
                department: departmentName,
                month: monthName,
                date: stringDate,
                login_time: "Leave",
                logout_time: "Leave",
                late: 0
            }
        } else {
            return {
                username: eachUser.username,
                department: departmentName,
                month: monthName,
                date: stringDate,
                login_time: "Absent",
                logout_time: "Absent",
                late: 0 
            }
        }
    })

    return res.send({
        attendances: result,
        message: "Fetched Successfully",
        flag: "SUCCESS"
    })
}

module.exports.monthly_attendance = async (req, res) => {
    const { user } = req.body

    const dates = datesOfAMonthByCurrentDate()
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

    const userAttendance = await UserDetails.aggregate([unwind, match])
        .then(result => result)
        .catch(err => {
            console.log(`❌ attendance.controller | 
                monthly_attendance |
                userAttendances: ${err.message}`);

            return {
                message: "Something went wrong",
                flag: "FAIL"
            }
        })

    const presentDates = userAttendance.map(each => each.attendance.date)
    
    const attendances = {}
    const logouts = {}
    const lates = {}

    userAttendance.map(each => {
        attendances[each.attendance.date] = each.attendance.login_time
        logouts[each.attendance.date] = each.attendance.logout_time
        lates[each.attendance.date] = each.attendance.late
    })

    const alldates = dates.map(each => {
        if(presentDates.includes(each.unix)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: attendances[each.unix],
                logout_time: logouts[each.unix],
                late: lates[each.unix]
            }
        } if(user.dayoff[0] === getDay(each.date)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: 'Day Off',
                logout_time: "Day Off",
                late: 0
            }
        } if(user.leaves[getDay(each.date)].includes(each.unix)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: 'Leave',
                logout_time: "Leave",
                late: 0
            }
        } else {
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: "Absent",
                logout_time: "Absent",
                late: 0
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
        console.log(`❌ attendance.controller | 
                search_attendance_by_date: Invalid API Key`);

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

    const userAttendance = await UserDetails.aggregate([unwind, match])
        .then(result => result)
        .catch(err => {
            console.log(`❌ attendance.controller | 
                search_attendance_by_date |
                userAttendances: ${err.message}`);

            return {
                message: "Something went wrong",
                flag: "FAIL"
            }
        })

    const presentDates = userAttendance.map(each => each.attendance.date)
    
    const attendances = {}
    const logouts = {}
    const lates = {}

    userAttendance.map(each => {
        attendances[each.attendance.date] = each.attendance.login_time
        logouts[each.attendance.date] = each.attendance.logout_time
        lates[each.attendance.date] = each.attendance.late
    })

    const alldates = dates.map(each => {
        if(presentDates.includes(each.unix)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: attendances[each.unix],
                logout_time: logouts[each.unix],
                late: lates[each.unix]
            }
        } if(user.dayoff[0] === getDay(each.date)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: 'Day Off',
                logout_time: "Day Off",
                late: 0
            }
        } if(user.leaves[getDay(each.date)].includes(each.unix)){
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: 'Leave',
                logout_time: "Leave",
                late: 0
            }
        } else {
            return {
                month: getMonth(each.date),
                date: each.date,
                login_time: "Absent",
                logout_time: "Absent",
                late: 0
            }
        }
    })

    res.send({
        attendances: alldates,
    })
}