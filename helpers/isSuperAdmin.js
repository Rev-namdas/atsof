require("dotenv").config();

module.exports.isSuperAdmin = async (req, res, next) => {
    const auth = req.headers.authorization;
    const role = auth?.slice(0, 3)
	
	if(role === process.env.SUPER_ADMIN){
		next()
	} else {
		return res.send({
            message: "You are not allowed for this operation",
            flag: "FAIL",
        });
	}
};