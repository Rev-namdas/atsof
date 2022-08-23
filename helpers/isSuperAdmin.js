const Users = require("../models/Users");

require("dotenv").config();

module.exports.isSuperAdmin = async (req, res, next) => {
    const auth = req.headers.authorization;

    const filter = {};
    filter["auth"] = auth;

    const fields = {
        user_id: 1,
        username: 1,
        role: 1,
        active: 1,
        department: 1,
        dept_access: 1,
    };

    const user = await Users.findOne(filter)
        .select(fields)
        .then((data) => data)
        .catch(() => null);

    if (user?.role?.includes(parseInt(process.env.SUPER_ADMIN))) {
        req.body.user = user
        next();
    } else {
        return res.send({
            message: "You are not allowed for this operation",
            flag: "FAIL",
        });
    }
};
