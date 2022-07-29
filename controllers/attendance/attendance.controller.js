const UserDetails = require("../../models/UserDetails");

module.exports.save_attendance = (req, res) => {
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

module.exports.save_logout_time = (req, res) => {
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