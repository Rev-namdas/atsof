module.exports.get_id = async (req, res, next) => {
    const auth = req.headers.authorization;
    const id = auth?.slice(3)

	if(id){
		req.body.user_id = id

		next()
	} else {
		return res.send({
            message: "User not found",
            flag: "FAIL",
        });
	}
};