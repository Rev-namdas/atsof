require("dotenv").config();
const { v4: uuid } = require("uuid");
const md5 = require("md5");
const Users = require("../models/Users");
const UserDetails = require("../models/UserDetails");

/**
 * user registration api
 * @param {object} req for getting request
 * @param {object} res for sending reponses
 *
 * @api_fields user_name, password, role, dayoff
 */
module.exports.user_registration = (req, res) => {
    const { user_name, password, role, dayoff } = req.body;
    const username = user_name.toUpperCase();

    Users.findOne({ username }, async (err, user_exist) => {
        if (err) throw err;
        if (user_exist)
            res.status(202).send({
                message: "Username Already Exist!",
                flag: "FAIL",
            });

        if (!user_exist) {
            const newUser = new Users({
                user_id: uuid(),
                username: username,
                password: md5(password) || md5("1234"),
                role: role || process.env.USER,
                dayoff: dayoff || 0,
            });

            await newUser.save();
            res.status(200).send({ message: "User Created!", flag: "SUCCESS" });
        }
    });
};

module.exports.user_login = (req, res) => {
    const { user_name, password } = req.body;
    const username = user_name.toUpperCase();

    Users.findOne({ username }, async (err, user_exist) => {
        if (err) throw err;
        if (!user_exist)
            return res
                .status(202)
                .send({ message: "You are not registered !", flag: "FAIL" });

        if (user_exist) {
            if (user_exist.password !== md5(password)) {
                return res
                    .status(202)
                    .send({ message: "Incorrect password!", flag: "FAIL" });
            }

            if (user_exist.password === md5(password)) {
                const output = {
                    id: user_exist.user_id,
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

    const errors = ["", null, undefined]

    if(errors.includes(user_id)) {
        return res.send({ message: "All fields are required", flag: "FAIL" })
    }

    UserDetails.findOne({ user_id: user_id }, async (err, user_exist) => {
        if(err) return res.send({ message: err.message, flag: "FAIL" })

        if(!user_exist){   
            if(month !== "" || date !== ""){
                const newUserDetails = new UserDetails({
                    user_id: user_id,
                    attendance: [
                        {
                            month: month,
                            details: [
                                {
                                    date: date,
                                    login_time: login_time,
                                    logout_time: logout_time || "",
                                    late: late || 0,
                                }
                            ]
                        }
                    ]
                })
    
                const done = await newUserDetails.save()
    
                if(done){
                    return res.send({ message: "Doesn't exist & created" })
                } else {
                    return res.send({ message: "Something went wrong" })
                }
            }
            return res.send({ message: "month or date not found" })
        }

        if(user_exist) {
            return res.send({ message: "User exist" })
        } 
    })
};

module.exports.fetch_details = async (req, res) => {
    const result = await UserDetails.find()

    return res.send(result)
} 

