const UserLeave = require("../../models/UserLeave");
const Users = require("../../models/Users");

module.exports.leave_apply = async (req, res) => {
    const {
        user_id,
        from_date,
        to_date,
        taken_dates,
        leave_count,
        leave_id,
        reason,
    } = req.body;

    const errors = ["", null, undefined];

    if (
        errors.includes(user_id) ||
        errors.includes(from_date) ||
        errors.includes(to_date) ||
        errors.includes(taken_dates) ||
        errors.includes(leave_count) ||
        errors.includes(leave_id) ||
        errors.includes(reason)
    ) {
        return res.send({
            message: "Invalid API Key !",
            flag: "FAIL"
        });
    }

    const filter = {};
    const newDocs = {};

    filter["user_id"] = user_id;
    filter["applied_dates"] = {
        $nin: taken_dates.map((each) => each.date),
    };

    newDocs["$push"] = {
        leave_dates: {
            from_date,
            to_date,
            taken_dates,
            leave_count,
            leave_id,
            reason,
            approved: 0,
            recommended: [],
        },
        applied_dates: {
            $each: taken_dates.map((each) => each.date),
        },
    };

    newDocs["$inc"] = {
        pending_status: leave_count,
    };

    const updated = await UserLeave.updateOne(filter, newDocs)
        .then((data) => {
            return data;
        })
        .catch((err) => {
            return res.send({
                message: err.message,
                flag: "FAIL",
            });
        });

    if (!updated) {
        return res.send({ message: "Internal Error", flag: "FAIL" });
    }

    if (updated) {
        if (updated.matchedCount === 0 && updated.modifiedCount === 0) {
            return res.send({
                message: "You have already applied for this date",
                flag: "FAIL",
            });
        }

        if (updated.matchedCount > 0 && updated.modifiedCount === 0) {
            return res.send({
                message: "Something went wrong",
                flag: "FAIL",
            });
        }

        if (updated.matchedCount > 0 && updated.modifiedCount > 0) {
            return res.send({
                message: "Leave Applied Successfully",
                flag: "SUCCESS",
            });
        }
    }
};

module.exports.pending_leaves = async (req, res) => {
    let filter = {};

    filter["pending_status"] = {
        $gt: 0,
    };

    let fields = {
        user_id: 1,
        username: 1,
        leave_dates: 1,
        pending_status: 1,
    };

    const docs_exist = await UserLeave.find(filter, fields)
        .lean()
        .then((data) => {
            return data;
        })
        .catch((err) => {
            return res.send({
                message: err.message,
                flag: "FAIL",
            });
        });

    if (!docs_exist) {
        return res.send({
            leaves: [],
            message: "Fetch Complete",
            flag: "SUCCESS",
        });
    }

    if (docs_exist) {
        let pending_leaves = [];

        docs_exist.map((each_doc) => {
            each_doc.leave_dates
                .filter((each) => each.approved === 0)
                .map((each) => {
                    each.user_id = each_doc.user_id;
                    each.name = each_doc.username;

                    pending_leaves.push(each);
                });
        });

        return res.send({
            leaves: pending_leaves,
            message: "Fetch Complete",
            flag: "SUCCESS",
        });
    }
};

module.exports.leave_approve = async (req, res) => {
    const { user_id, from_date, to_date, leave_count, taken_dates } = req.body;

    const errors = [null, undefined, ""]

    if(
        errors.includes(user_id) ||
        errors.includes(from_date) ||
        errors.includes(to_date) ||
        errors.includes(leave_count) ||
        errors.includes(taken_dates)
    ){
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }
    
    let filter = {};

    filter["user_id"] = user_id;
    filter["leave_dates.approved"] = 0;
    filter["leave_dates.from_date"] = from_date;
    filter["leave_dates.to_date"] = to_date;

    const leave_exist = await UserLeave.findOne(filter)
        .then((data) => {
            return data;
        })
        .catch((err) => {
            return res.send({
                message: err.message,
                flag: "FAIL",
            });
        });

    if (!leave_exist) {
        return res.send({
            message: "Already Approved By You",
            flag: "FAIL",
        });
    }

    if (leave_exist) {
        const approved_leave = leave_exist.leave_dates.find(
            (each) => each.from_date === from_date && each.to_date === to_date
        );

        approved_leave.approved = 1;
        leave_exist.pending_status = leave_exist.pending_status - leave_count;

        const taken_leave_type = leave_exist.leave.find(
            (each) => each.leave_id === approved_leave.leave_id
        );

        taken_leave_type.leave_balance =
            taken_leave_type.leave_balance - leave_count;
        taken_leave_type.leave_taken =
            taken_leave_type.leave_taken + leave_count;
    }

    const user_exist = await Users.findOne({ user_id })
        .then((data) => {
            return data;
        })
        .catch((err) => {
            return res.send({
                message: err.message,
                flag: "FAIL",
            });
        });

    if (!user_exist) {
        return res.send({
            message: "User ID Not Found In DB",
            flag: "FAIL",
        });
    }

    if (user_exist) {
        taken_dates.map((each) => {
            user_exist.leaves[each.day].push(each.date);
        });
    }

    user_exist.save();
    leave_exist.save();

    return res.send({ message: "Leave approved", flag: "SUCCESS" });
};

module.exports.leave_decline = async (req, res) => {
    const { user_id, from_date, to_date } = req.body;

    const errors = [null, undefined, ""]

    if(
        errors.includes(user_id) ||
        errors.includes(from_date) ||
        errors.includes(to_date)
    ){
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }

    const filter = {};
    const updateDoc = {};

    filter["user_id"] = user_id;
    filter["leave_dates.approved"] = 0;
    filter["leave_dates.from_date"] = from_date;
    filter["leave_dates.to_date"] = to_date;

    updateDoc["$set"] = {
        "leave_dates.$.approved": -1,
    };

    const updated = await UserLeave.updateOne(filter, updateDoc)
        .then((update) => {
            return update;
        })
        .catch((err) => {
            return res.send({
                message: err.message,
                flag: "FAIL",
            });
        });

    if (updated.matchedCount === 0) {
        return res.send({
            message: "Leave Not Found",
            flag: "FAIL",
        });
    }

    if (updated.matchedCount === 1 && updated.modifiedCount === 0) {
        return res.send({
            message: "Something went wrong",
            flag: "FAIL",
        });
    }

    if (updated.matchedCount !== 0 && updated.modifiedCount !== 0) {
        return res.send({
            message: "Leave Declined",
            flag: "SUCCESS",
        });
    }
};

module.exports.leave_recommend = async (req, res) => {
    const { decision, user_id, employee_id, from_date, to_date } = req.body;

    const errors = [null, undefined, ""]

    if(
        errors.includes(decision) ||
        errors.includes(user_id) ||
        errors.includes(employee_id) ||
        errors.includes(from_date) ||
        errors.includes(to_date)
    ){
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }

    const fields = {
        user_id: 1,
        username: 1,
    };
    const user_exist = await Users.findOne({ user_id }).select(fields);

    if (!user_exist) {
        return res.send({
            message: "Recommend's User Not Found",
            flag: "FAIL",
        });
    }

    const filter = {};
    const updatedDoc = {};

    filter["user_id"] = employee_id;
    filter["leave_dates.approved"] = 0;
    filter["leave_dates.from_date"] = from_date;
    filter["leave_dates.to_date"] = to_date;
    filter["leave_dates.recommended"] = {
        $nin: user_exist.username,
    };
    filter["leave_dates.declined"] = {
        $nin: user_exist.username,
    };

    if (decision === "recommend") {
        updatedDoc["$push"] = {
            "leave_dates.$.recommended": user_exist.username,
        };
    } else if (decision === "decline") {
        updatedDoc["$push"] = {
            "leave_dates.$.declined": user_exist.username,
        };
    }

    const updated = await UserLeave.updateOne(filter, updatedDoc)
        .then((update) => {
            return update;
        })
        .catch((err) => {
            return res.send({
                message: err.message,
                flag: "FAIL",
            });
        });

    if (!updated) {
        return res.send({
            message: "Something went wrong",
            flag: "FAIL",
        });
    }

    if (updated) {
        if (updated.matchedCount === 0) {
            return res.send({
                message: "Already Submitted",
                flag: "FAIL",
            });
        } else if (updated.matchedCount !== 0 && updated.modifiedCount === 0) {
            return res.send({
                message: "Leave Not Found",
                flag: "FAIL",
            });
        } else if (updated.matchedCount === 1 && updated.modifiedCount === 1) {
            return res.send({
                message: "Decision Submitted",
                flag: "SUCCESS",
            });
        } else {
            return res.send({
                message: "Something went wrong",
                flag: "FAIL",
            });
        }
    }
};

module.exports.user_leave_status = async (req, res) => {
    const { user_id } = req.body;

    const errors = [null, undefined, ""]

    if(errors.includes(user_id)){
        return res.send({
            message: "Invalid API Key",
            flag: "FAIL"
        })
    }

    const leave_details = await UserLeave.findOne({ user_id })
        .then((data) => {
            return data;
        })
        .catch(() => {
            return {};
        });

    return res.send({
        message: "Fetch Complete",
        leave_details: leave_details,
        flag: "SUCCESS",
    });
};
