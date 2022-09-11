require("dotenv").config();
const { v4: uuid } = require("uuid");
const md5 = require("md5");
const Users = require("../../models/Users");
const UserLeave = require("../../models/UserLeave");
const { date_to_unix } = require("../../helpers/date_to_unix");
const { validateApiKey } = require("../../helpers/validateApiKey");
const UserDetails = require("../../models/UserDetails");
const moment = require("moment")

module.exports.user_registration = async (req, res) => {
    const { user_name, password, role, dayoff, office_time,
        leaves, department_id, dept_access } = req.body;

    const isValid = validateApiKey({ user_name, password, 
        role, dayoff, office_time, 
        leaves, department_id, dept_access })

    if(!isValid){
        console.log(`❌ auth.controller | 
                user_registration: Invalid API Key`);

        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }

    const username = user_name.trim().toUpperCase();
    const user_id = uuid();

    const user_exist = await Users.findOne({ username })
        .then((user) => {
            return user
        })
        .catch((err) => {
            console.log(`❌ auth.controller | 
                user_registration |
                user_exist: ${err.message}`);

            return res.status(202).send({
                message: "Something went wrong",
                flag: "FAIL",
            });
        })

    if(user_exist){
        console.log(`❌ auth.controller | 
            user_registration |
            user_exist: Username already exist`);

        return res.status(202).send({
            message: "Username already exist!",
            flag: "FAIL",
        });
    }

    let user

    if(!user_exist){
        const newUser = new Users({
            auth: user_id,
            user_id: user_id,
            username: username,
            password: md5(password) || md5("1234"),
            role: role || process.env.USER,
            dayoff: dayoff || 0,
            office_time: office_time,
            department_id: department_id,
            dept_access: dept_access
        });

        user = await newUser.save();
    }

    const leaveFormData = {
        user_id: user.user_id,
        username: user.username,
        department_id: user.department_id,
        leaves: {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: []
        }
    }

    const leaveInstance = new UserLeave(leaveFormData);
    await leaveInstance.save();

    let filter = {};
    let updateDocs = {};

    const checkIDs = leaves.map((each) => each.leave_id);
    filter["user_id"] = user.user_id;
    filter["leave.leave_id"] = { $nin: checkIDs };

    updateDocs["$push"] = {
        leave: {
            $each: leaves,
        },
    };

    let userLeaveInitiazed = false
    const updated = await UserLeave.updateOne(filter, updateDocs)
        .then((doc) => {
            return doc
        })
        .catch((err) => {
            console.log(`❌ auth.controller | 
                user_registration |
                updated: ${err.message}`);

            return res.status(202).send({
                message: "Something went wrong",
                flag: "FAIL",
            });
        })

    if (!updated) {
        console.log(`❌ auth.controller | 
            user_registration |
            !updated: DB not responding`);

        return res.send({
            message: "Something went wrong",
            flag: "FAIL",
        });
    }

    if (updated) {
        if (updated.matchedCount === 0) {
            console.log(`❌ auth.controller | 
                user_registration |
                updated: User ID not found in leave instance`);

            return res.send({
                message: "User ID Not Found in Leave Instance !",
                flag: "FAIL",
            });
        }

        if (
            updated.matchedCount > 0 &&
            updated.modifiedCount === 0
        ) {
            console.log(`❌ auth.controller | 
                user_registration |
                modifiedCount: Leave ID Exists`);

            return res.send({
                message: "Leave ID Exists !",
                flag: "FAIL",
            });
        }

        if (updated.matchedCount > 0 && updated.modifiedCount > 0) {
            userLeaveInitiazed = true
        }
    }

    if(userLeaveInitiazed){
        const attendanceFormData = {
            user_id: user.user_id,
            username: user.username,
            department_id: user.department_id,
            attendance: []
        }

        const userAttendanceInstance = new UserDetails(attendanceFormData)
        const saved = userAttendanceInstance.save()

        if(!saved){
            console.log(`❌ auth.controller | 
                user_registration |
                !saved: Something went wrong`);

            return res.send({
                message: "Something went wrong",
                flag: "FAIL"
            })
        }

        return res.send({
            message: "User Created !",
            flag: "SUCCESS",
        });
    }
};

module.exports.user_login = async (req, res) => {
    const { user_name, password } = req.body;

    const isValid = validateApiKey({ user_name, password })

    if(!isValid){
        console.log(`❌ auth.controller | 
                user_login: Invalid API Key`);

        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }

    const username = user_name.toUpperCase();

    const user_exist = await Users.findOne({ username })
        .then((data) => {
            return data
        })
        .catch((err) => {
            console.log(`❌ auth.controller | 
                user_login |
                user_exist: ${err.message}`);

            return res.status(202).send({
                message: "Something went wrong", 
                flag: "FAIL"
            });
        })

    if (!user_exist){
        console.log(`❌ auth.controller | 
            user_login |
            !user_exist: You are not registered`);

        return res.status(202).send({
            message: "You are not registered!", 
            flag: "FAIL"
        });
    }

    if (user_exist) {
        if (user_exist.password !== md5(password)) {
            console.log(`❌ auth.controller | 
                user_login |
                user_exist: Incorrect password`);

            return res.status(202).send({
                message: "Incorrect password!",
                flag: "FAIL"
            });
        }

        if (user_exist.password === md5(password)) {
            if (!user_exist.active) {
                console.log(`❌ auth.controller | 
                    user_login |
                    user_exist: Account deactivated`);

                return res.send({
                    message: "Account Deactivated!",
                    flag: "FAIL",
                });
            }

            const today = new Date();

            if(user_exist.leaves[today.getDay()].includes(date_to_unix(today))){
                console.log(`❌ auth.controller | 
                    user_login |
                    user_exist: Not allowed on leave day`);
                
                return res.send({
                    message: "Not allowed on leave day",
                    flag: "FAIL",
                });
            }

            if (
                (user_exist.dayoff.includes(today.getDay())) &&
                (!user_exist.allowed_dates.includes(moment().startOf('date').unix()))
            ) {
                console.log(`❌ auth.controller | 
                    user_login |
                    user_exist: Not allowed today`);

                return res.send({
                    message: "Not allowed today",
                    flag: "FAIL",
                });
            }

            const output = {
                auth: user_exist.user_id,
                user_id: user_exist.user_id,
                username: user_exist.username,
                role: user_exist.role,
                dayoff: user_exist.dayoff,
                department_id: user_exist.department_id,
                dept_access: user_exist.dept_access,
                message: "Login successful",
                flag: "SUCCESS",
            };
            return res.status(202).send(output);
        }
    }
};
