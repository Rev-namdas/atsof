require("dotenv").config();

module.exports.validate_permission = async (req, res, next) => {
    const { client_roles } = req.body;
    const isSuperAdmin = client_roles.includes(parseInt(process.env.SUPER_ADMIN));
    const isAdmin = client_roles.includes(parseInt(process.env.ADMIN));

    if (isSuperAdmin || isAdmin) {
        next();
    } else {
        return res.send({
            message: "You are not allowed for this operation",
            flag: "FAIL",
        });
    }
};