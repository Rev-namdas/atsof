require("dotenv").config();

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