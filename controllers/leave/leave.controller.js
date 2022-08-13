const UserLeave = require("../../models/UserLeave");
const Users = require("../../models/Users");

module.exports.leave_apply = (req, res) => {
    const { user_id, from_date, to_date, 
        taken_dates, leave_count, leave_id,
        reason } = req.body

    const filter = {}
    const newDocs = {}

    filter['user_id'] = user_id
    filter['applied_dates'] = {
        "$nin": taken_dates.map(each => each.date)
    }

    newDocs["$push"] = {
        "leave_dates": {
            from_date,
            to_date,
            taken_dates,
            leave_count,
            leave_id,
            reason,
            approved: 0,
            recommended: []
        },
        "applied_dates": {
            "$each": taken_dates.map(each => each.date)
        }
    }

    newDocs["$inc"] = {
        "pending_status": 1
    }

    UserLeave.updateOne(filter, newDocs, (err, update) => {
        if(err) return res.send({ message: err.message, flag: "FAIL" })

        if(!update){
            return res.send({ message: "Internal Error", flag: "FAIL" })
        }

        if(update){
            if(update.matchedCount === 0 && 
                update.modifiedCount === 0){
                return res.send({
                    message: "You have already applied for this date",
                    flag: "FAIL"
                })
            }

            if(update.matchedCount > 0 &&
                update.modifiedCount === 0){
                return res.send({
                    message: "Something went wrong",
                    flag: "FAIL"
                })
            }

            if(update.matchedCount > 0 && 
                update.modifiedCount > 0){
                return res.send({
                    message: "Leave Applied Successfully",
                    flag: "SUCCESS"
                })
            }
        }
    })
}

module.exports.pending_leaves = async (req, res) => {
    let filter = {};

    filter["pending_status"] = {
        $gt: 0,
    };
    filter["leave_dates.approved"] = 0

    let fields = {
        user_id: 1,
        username: 1,
        leave_dates: 1,
        pending_status: 1,
    };

    const userLeaves = await UserLeave.find(filter).select(fields);
    return res.send({
        leaves: userLeaves,
        message: "Fetch Complete",
        flag: "SUCCESS",
    });
};

module.exports.leave_approve = (req, res) => {
    const { user_id, date } = req.body;
    let filter = {};

    filter["user_id"] = user_id;
    filter["pending_leaves.date"] = date;

    UserLeave.findOne(filter, async (err, user_exist) => {
        if (err)
            return res.send({
                message: err.message,
                flag: "FAIL",
            });

        if (!user_exist) {
            return res.send({
                message: "Not found in DB",
                flag: "FAIL",
            });
        }

        if (user_exist) {
            const approved_leave = user_exist.pending_leaves.find(
                (each) => each.date === date
            );

            user_exist.leave_dates.push({
                date: approved_leave.date,
                reason: approved_leave.reason,
                leave_id: approved_leave.leave_id,
                recommended: approved_leave.recommended,
            });

            user_exist.leave.map((each) => {
                if (each.leave_id === approved_leave.leave_id) {
                    each.leave_balance = each.leave_balance - 1;
                }
            });

            user_exist.pending_leaves = user_exist.pending_leaves.filter(
                (each) => each.date !== date
            );

            user_exist.pending_status = user_exist.pending_status - 1

            Users.findOne({ user_id }, async (err, user) => {
                if(err) return res.send({ message: err.message, flag: 'FAIL' })

                if(!user){
                    return res.send({ message: "User ID Not Found", flag: "FAIL" })
                }

                if(user){
                    user.leaves[approved_leave.day].push(date)
                    await user.save()
                }
            })

            await user_exist.save();

            return res.send({ message: "Leave approved", flag: "SUCCESS" });
        }
    });
};
