const Users = require("../models/Users");

require("dotenv").config();

module.exports.check_client = async (req, res, next) => {
    const auth = req.headers.authorization;

    const filter = {};
    filter["auth"] = auth;

    const user = await Users.findOne(filter)
        .then((data) => data)
        .catch(() => null);

    if (user) {
        req.body.user = user
        next();
    } else {
        return res.send({
            message: "You are not allowed for this operation",
            flag: "FAIL",
        });
    }
};
