const Users = require("../../models/Users");

module.exports.account_status_change = (req, res) => {
    const { user_id, account_status } = req.body;

    Users.updateOne(
        { user_id },
        { $set: { active: account_status } },
        (err, updated) => {
            if (err) {
                return res.send({ message: err.message, flag: "FAIL" });
            }

            if (updated.matchedCount === 0) {
                return res.send({
                    message: "User ID not exist!",
                    flag: "FAIL",
                });
            } else if (
                updated.matchedCount !== 0 &&
                updated.modifiedCount === 0
            ) {
                return res.send({ message: "Doc Not Updated!", flag: "FAIL" });
            } else if (
                updated.matchedCount !== 0 &&
                updated.modifiedCount !== 0
            ) {
                return res.send({
                    message: `User ${
                        account_status ? "Activated" : "Deactivated"
                    } !`,
                    flag: "SUCCESS",
                });
            }
        }
    );
};

module.exports.fetch_users = async (req, res) => {
    const fields = {
        _id: 1,
        user_id: 1,
        username: 1,
        role: 1,
        active: 1,
    };
    const result = await Users.find().select(fields);

    return res.send(result);
};