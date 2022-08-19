require("dotenv").config();

module.exports.check_permission = async (req, res, next) => {
    const auth = req.headers.authorization;
    const role = auth?.slice(0, 3)

	console.log('role', role);
	
	if(role === process.env.SUPER_ADMIN || role === process.env.ADMIN){
		next()
	} else {
		return res.send({
            message: "You are not allowed for this operation",
            flag: "FAIL",
        });
	}
};