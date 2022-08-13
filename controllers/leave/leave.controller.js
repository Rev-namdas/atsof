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
        "pending_status": leave_count
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

    let fields = {
        user_id: 1,
        username: 1,
        leave_dates: 1,
        pending_status: 1,
    };

    UserLeave.findOne(filter, fields, (err, doc_exist) => {
        if(err) return res.send({
            message: err.message,
            flag: "FAIL"
        })

        if(!doc_exist){
            return res.send({
                leaves: [],
                message: "Fetch Complete",
                flag: "SUCCESS",
            });
        }

        if(doc_exist){
            let leave_info = doc_exist.leave_dates.filter(each => 
                each.approved === 0)

            const pending_leaves = leave_info.map(each => ({
                ...each,
                user_id: doc_exist.user_id,
                name: doc_exist.username
            }))

            return res.send({
                leaves: pending_leaves,
                message: "Fetch Complete",
                flag: "SUCCESS",
            });
        }
    }).lean()

    
};

module.exports.leave_approve = (req, res) => {
    const { user_id, from_date, to_date, leave_count, taken_dates } = req.body;
    let filter = {};

    filter["user_id"] = user_id;
    filter["leave_dates.approved"] = 0
    filter["leave_dates.from_date"] = from_date;
    filter["leave_dates.to_date"] = to_date;

    UserLeave.findOne(filter, async (err, user_exist) => {
        if (err)
            return res.send({
                message: err.message,
                flag: "FAIL",
            });

        if (!user_exist) {
            return res.send({
                message: "Already Approved By You",
                flag: "FAIL",
            });
        }

        if (user_exist) {
            const approved_leave = user_exist.leave_dates.find(each => 
                each.from_date === from_date &&
                each.to_date === to_date
            )

            approved_leave.approved = 1
            user_exist.pending_status = user_exist.pending_status - leave_count
            
            const taken_leave_type = user_exist.leave.find(each => 
                each.leave_id === approved_leave.leave_id)

            taken_leave_type.leave_balance = taken_leave_type.leave_balance - leave_count
            taken_leave_type.leave_taken = taken_leave_type.leave_taken + leave_count

            user_exist.save()

            Users.findOne({ user_id }, (err, user_exist) => {
                if(err) return res.send({
                    message: err.message,
                    flag: "FAIL"
                })

                if(!user_exist){
                    return res.send({
                        message: "User ID Not Found In DB",
                        flag: "FAIL"
                    })
                }

                if(user_exist){
                    taken_dates.map(each => {
                        user_exist.leaves[each.day].push(each.date)
                    })

                    user_exist.save()
                }
            })

            return res.send({ message: "Leave approved", flag: "SUCCESS" });
        }
    });
};

module.exports.user_leave_status = async (req, res) => {
    const { id } = req.params

    const leave_details = await UserLeave.findOne({ user_id: id })
    
    return res.send({
        message: "Fetch Complete",
        leave_details: leave_details,
        flag: "SUCCESS"
    })
}