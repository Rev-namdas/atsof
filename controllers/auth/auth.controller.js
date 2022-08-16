require("dotenv").config();
const { v4: uuid } = require("uuid");
const md5 = require("md5");
const Users = require("../../models/Users");
const UserLeave = require("../../models/UserLeave");
const { date_to_unix } = require("../../helpers/date_to_unix");


/**
 * user registration api
 * @param {object} req for getting request
 * @param {object} res for sending reponses
 *
 * @api_fields user_name, password, role, dayoff, office_time
 */
module.exports.user_registration = async (req, res) => {
    const { user_name, password, role, dayoff, office_time, leaves } = req.body;
    const username = user_name.trim().toUpperCase();
    const user_id = uuid();

    const user_exist = await Users.findOne({ username })
        .then((user) => {
            return user
        })
        .catch((err) => {
            return res.status(202).send({
                message: err.message,
                flag: "FAIL",
            });
        })

    if(user_exist){
        return res.status(202).send({
            message: "Username already exist!",
            flag: "FAIL",
        });
    }

    let user

    if(!user_exist){
        const newUser = new Users({
            user_id: user_id,
            username: username,
            password: md5(password) || md5("1234"),
            role: role || process.env.USER,
            dayoff: dayoff || 0,
            office_time: office_time,
        });

        user = await newUser.save();
    }

    const leaveFormData = {
        user_id: user.user_id,
        username: user.username,
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

    const updated = await UserLeave.updateOne(filter, updateDocs)
        .then((doc) => {
            return doc
        })
        .catch((err) => {
            return res.status(202).send({
                message: err.message,
                flag: "FAIL",
            });
        })

    if (!updated) {
        return res.send({
            message: "DB not responding",
            flag: "FAIL",
        });
    }

    if (updated) {
        if (updated.matchedCount === 0) {
            return res.send({
                message: "User ID Not Found in Leave Instance !",
                flag: "FAIL",
            });
        }

        if (
            updated.matchedCount > 0 &&
            updated.modifiedCount === 0
        ) {
            return res.send({
                message: "Leave ID Exists !",
                flag: "FAIL",
            });
        }

        if (updated.matchedCount > 0 && updated.modifiedCount > 0) {
            return res.send({
                message: "User Created !",
                flag: "SUCCESS",
            });
        }

        return res.send({
            message: "Something went wrong !",
            log: updated,
            flag: "FAIL",
        });
    }
};

module.exports.user_login = async (req, res) => {
    const { user_name, password } = req.body;
    const username = user_name.toUpperCase();

    const user_exist = await Users.findOne({ username })
        .then((data) => {
            return data
        })
        .catch((err) => {
            return res.status(202).send({
                message: err.message, 
                flag: "FAIL"
            });
        })

    if (!user_exist){
        return res.status(202).send({
            message: "You are not registered!", 
            flag: "FAIL"
        });
    }

    if (user_exist) {
        if (user_exist.password !== md5(password)) {
            return res.status(202).send({
                message: "Incorrect password!",
                u: user_exist,
                up: user_exist.password,
                p: md5(password),
                flag: "FAIL"
            });
        }

        if (user_exist.password === md5(password)) {
            if (!user_exist.active) {
                return res.send({
                    message: "Account Deactivated!",
                    flag: "FAIL",
                });
            }

            const today = new Date();

            if(user_exist.leaves[today.getDay()].includes(date_to_unix(today))){
                return res.send({
                    message: "Not allowed on leave day",
                    flag: "FAIL",
                });
            }

            if (user_exist.dayoff.includes(today.getDay())) {
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
};
