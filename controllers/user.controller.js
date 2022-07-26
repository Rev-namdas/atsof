require("dotenv").config();
const { v4: uuid } = require("uuid");
const md5 = require("md5");
const Users = require("../models/Users");
const UserDetails = require("../models/UserDetails");
const UserLeave = require("../models/UserLeave");

/**
 * user registration api
 * @param {object} req for getting request
 * @param {object} res for sending reponses
 *
 * @api_fields user_name, password, role, dayoff, office_time
 */
module.exports.user_registration = (req, res) => {
    const { user_name, password, role, dayoff, office_time, leaves } = req.body;
    const username = user_name.toUpperCase();
    const user_id = uuid();

    Users.findOne({ username }, async (err, user_exist) => {
        if (err)
            return res.status(202).send({
                message: err.message,
                flag: "FAIL",
            });
        if (user_exist)
            return res.status(202).send({
                message: "Username already exist!",
                flag: "FAIL",
            });

        if (!user_exist) {
            const newUser = new Users({
                user_id: user_id,
                username: username,
                password: md5(password) || md5("1234"),
                role: role || process.env.USER,
                dayoff: dayoff || 0,
                office_time: office_time,
            });

            const user = await newUser.save();

            const leaveInstance = new UserLeave({ user_id: user.user_id })
            await leaveInstance.save()

            let filter = {}
            let updateDocs = {}

            const checkIDs = leaves.map(each => each.leave_id)
            filter["user_id"] = user.user_id
            filter["leave.leave_id"] = { "$nin": checkIDs }

            updateDocs["$push"] = {
                "leave": {
                    "$each": leaves
                }
            }

            UserLeave.updateOne(filter, updateDocs, (err, updated) => {
                if(err) return res.send({ message: err.message, flag: "FAIL" })

                if(!updated){
                    return res.send({ message: "DB not responding", flag: "FAIL" })
                }
                
                if(updated){
                    if(updated.matchedCount === 0){
                        return res.send({ message: "User ID Not Found !", flag: "FAIL" })
                    }
                    
                    if(updated.matchedCount > 0 && updated.modifiedCount === 0){
                        return res.send({ message: "Leave ID Exists !", flag: "FAIL" })
                    }
                    
                    if(updated.matchedCount > 0 && updated.modifiedCount > 0){
                        return res.send({ message: "User Created !", flag: "SUCCESS" })
                    }
                    
                    return res.send({ message: "Something went wrong !", log: updated, flag: "FAIL" })
                }
            })
        }
    });
};

module.exports.user_login = (req, res) => {
    const { user_name, password } = req.body;
    const username = user_name.toUpperCase();

    Users.findOne({ username }, async (err, user_exist) => {
        if (err)
            return res
                .status(202)
                .send({ message: err.message, flag: "FAIL" });

        if (!user_exist)
            return res
                .status(202)
                .send({ message: "You are not registered!", flag: "FAIL" });

        if (user_exist) {
            if (user_exist.password !== md5(password)) {
                return res
                    .status(202)
                    .send({ message: "Incorrect password!", flag: "FAIL" });
            }

            if (user_exist.password === md5(password)) {
                const today = new Date();
                if (user_exist.dayoff === today.getDay() + 1) {
                    return res.send({
                        message: "Not allowed today",
                        flag: "FAIL",
                    });
                }

                const output = {
                    user_id: user_exist.user_id,
                    username: user_exist.username,
                    role: user_exist.role,
                    message: "Login successful",
                    flag: "SUCCESS",
                };
                return res.status(202).send(output);
            }
        }
    });
};

module.exports.user_attendance = (req, res) => {
    const { user_id, month, date, login_time, logout_time, late } = req.body;

    const errors = ["", null, undefined];

    if (
        errors.includes(user_id) ||
        errors.includes(month) ||
        errors.includes(date)
    ) {
        return res.send({
            message: "user_id, month, date fields are required",
            flag: "FAIL",
        });
    }

    const formData = {};

    formData.user_id = user_id;
    formData.attendance = {
        month: month,
        date: date,
        login_time: login_time,
        logout_time: logout_time || login_time,
        late: late || 0,
    };

    UserDetails.findOne({ user_id: user_id }, async (err, user_exist) => {
        if (err) return res.send({ message: err.message, flag: "FAIL" });

        if (!user_exist) {
            const done = new UserDetails(formData).save();

            if (done) {
                return res.send({
                    message: `You are logged in on ${login_time}`,
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
            UserDetails.findOne(
                {
                    user_id: user_id,
                    "attendance.month": month,
                    "attendance.date": date,
                },
                (err, date_exists) => {
                    if (err) {
                        return res.send({ message: err.message, flag: "FAIL" });
                    }

                    if (!date_exists) {
                        user_exist.attendance.push(formData.attendance);
                        user_exist.save();

                        return res.send({
                            message: `You have logged in on ${login_time}`,
                            login_date: date,
                            flag: "SUCCESS",
                        });
                    }

                    if (date_exists) {
                        date_exists.attendance.map((each) => {
                            if (each.date === date) {
                                each.logout_time = login_time;
                            }
                        });

                        const updated = date_exists.save();

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
            );
        }
    });
};

module.exports.user_logout = (req, res) => {
    const { user_id, month, date, logout_time } = req.body;

    const errors = ["", null, undefined];

    if (
        errors.includes(user_id) ||
        errors.includes(month) ||
        errors.includes(date) ||
        errors.includes(logout_time)
    ) {
        return res.send({
            message: "user_id, month, date fields are required",
            flag: "FAIL",
        });
    }

    UserDetails.findOne(
        {
            user_id: user_id,
            "attendance.month": month,
            "attendance.date": date,
        },
        (err, date_exists) => {
            if (err) {
                return res.send({ message: err.message, flag: "FAIL" });
            }

            if (date_exists) {
                date_exists.attendance.map((each) => {
                    if (each.date === date) {
                        each.logout_time = logout_time;
                    }
                });

                const updated = date_exists.save();

                if (updated) {
                    return res.send({
                        message: `You have logged out on ${logout_time}`,
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
        }
    );
};

module.exports.fetch_attendance_by_user_id = async (req, res) => {
    const { user_id } = req.params;
    const result = await UserDetails.findOne({ user_id });

    return res.send(result);
};

module.exports.fetch_details = async (req, res) => {
    const result = await UserDetails.find();

    return res.send(result);
};

module.exports.validate_permission = async (req, res, next) => {
    const { client_roles } = req.body;

    const permitted = client_roles.includes(parseInt(process.env.SUPER_ADMIN));

    if (permitted) {
        next();
    } else {
        return res.send({
            message: "You are not allowed for this operation",
            flag: "FAIL",
        });
    }
};
