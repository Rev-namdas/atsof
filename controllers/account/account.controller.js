const { validateApiKey } = require("../../helpers/validateApiKey");
const Users = require("../../models/Users");

module.exports.account_status_change = async (req, res) => {
    const { user_id, account_status } = req.body;

    const isValid = validateApiKey({ user_id, account_status })

    if(!isValid){
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }

    const filter = {}
    const docUpdate = {}

    filter["user_id"] = user_id
    docUpdate["$set"] = {
        active: account_status
    }

    const updated = await Users.updateOne(filter, docUpdate)
        .then((data) => {
            return data
        })
        .catch((err) => {
            return res.send({
                message: err.message,
                flag: "FAIL"
            })
        })

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
};

module.exports.fetch_users = async (req, res) => {
    const fields = {
        _id: 1,
        user_id: 1,
        username: 1,
        role: 1,
        active: 1,
    };
    
    const result = await Users.find().select(fields)
        .then((data) => {
            return data
        })
        .catch(() => {
            return []
        })

    return res.send(result);
};