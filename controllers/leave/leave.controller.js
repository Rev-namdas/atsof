const UserLeave = require("../../models/UserLeave");
const Users = require("../../models/Users");

module.exports.leave_apply = (req, res) => {
    const { user_id, name, day, date, reason, leave_id } = req.body;
    const filter = {};
    const updatedDocs = {};

    filter["user_id"] = user_id;
    filter["pending_leaves.date"] = { $ne: date };

    updatedDocs["$push"] = {
        pending_leaves: {
            name,
            date,
            day,
            reason,
            leave_id,
            pending: true,
            recommended: [],
        },
    };
    updatedDocs["$inc"] = {
        pending_status: 1,
    };

    UserLeave.updateOne(filter, updatedDocs, (err, updated) => {
        if (err) return res.send({ message: err.message, flag: "FAIL" });

        if (!updated) {
            return res.send({
                message: "Server Internal Error!",
                flag: "FAIL",
            });
        }

        if (updated) {
            if (updated.matchedCount === 0) {
                return res.send({
                    message: "You have already applied for this date",
                    flag: "FAIL",
                });
            } else if (updated.matchedCount > 0 && updated.modifiedCount > 0) {
                return res.send({
                    message: "Leave Apply Successful",
                    flag: "SUCCESS",
                });
            }
        }
    });
};

// module.exports.leave_apply = (req, res) => {
//     const { user_id, day, date, reason, leave_id } = req.body;
//     const filter = {};
//     const updatedDocs = {};

//     filter["user_id"] = user_id;
//     filter["leave_dates.date"] = date;

//     updatedDocs["$push"] = {
//         leave_dates: {
//             date,
//             reason,
//             leave_id,
//         },
//     };

// 	UserLeave.findOne({ user_id }, async (err, user_exist) => {
// 		if (err) return res.send({ message: err.message, flag: "FAIL" });

// 		if(!user_exist){
// 			return res.send({
// 				message: "User ID not exist in Leave Instance!",
// 				flag: 'FAIL'
// 			})
// 		}

// 		if(user_exist){
// 			let idFound = user_exist.leave.map(each => {
// 				if(each.leave_id === leave_id){
// 					console.log('leave deducted');
// 					each.leave_balance = each.leave_balance - 1

// 					return true
// 				} else {
// 					return false
// 				}
// 			})

// 			if(!idFound.includes(true)){
// 				return res.send({ message: "Leave Type Not Found!", flag: 'FAIL' })
// 			}

// 			console.log('checking date');
// 			user_exist.leave_dates.map(each => {
// 				if(each.date === date){
// 					return res.send({
// 						message: 'You have already applied this date before!',
// 						flag: 'FAIL'
// 					})
// 				}
// 			})

// 			console.log('pushing leave');
// 			user_exist.leave_dates.push({
// 				date, reason, leave_id
// 			})

// 			await user_exist.save()

// 			Users.findOne({ user_id }, async (err, user_exist) => {
// 				if(err) return res.send({
// 					message: err.message,
// 					flag: 'FAIL'
// 				})

// 				if(!user_exist){
// 					return res.send({
// 						message: 'User ID Not Found !',
// 						flag: 'FAIL'
// 					})
// 				}

// 				if(user_exist){
// 					user_exist.leaves[day].push(date)
// 					await user_exist.save()
// 				}
// 			})

// 			return res.send({
// 				message: "Leave Apply Succesful",
// 				flag: 'SUCCESS'
// 			})
// 		}
// 	})

//     // UserLeave.updateOne(filter, updatedDocs, (err, updated) => {
//     //     if (err) return res.send({ message: err.message, flag: "FAIL" });

//     //     if (!updated) {
//     //         return res.send({
//     //             message: "DB not responding",
//     //             flag: "FAIL",
//     //         });
//     //     }

//     //     if (updated) {
//     //         if (updated.matchedCount === 0) {
//     //             return res.send({
//     //                 message: "User ID Not Found in Leave Instance !",
//     //                 flag: "FAIL",
//     //             });
//     //         }

//     //         if (updated.matchedCount > 0 && updated.modifiedCount === 0) {
//     //             return res.send({
//     //                 message: "You have already applied on this date !",
//     //                 flag: "FAIL",
//     //             });
//     //         }

//     //         if (updated.matchedCount > 0 && updated.modifiedCount > 0) {
// 	// 			Users.findOne({ user_id }, (err, user_exist) => {
// 	// 				if(err) return res.send({ message: err.message, flag: 'FAIL' })

// 	// 				if(!user_exist){
// 	// 					return res.send({ message: 'User Not Found!', flag: 'FAIL' })
// 	// 				}

// 	// 				if(user_exist){
// 	// 					user_exist.leaves[day].push(date)

// 	// 					await user_exist.save()

// 	// 					return res.send({
// 	// 						message: "Leave Applied !",
// 	// 						flag: "SUCCESS",
// 	// 					});
// 	// 				}
// 	// 			})

//     //         }

//     //         return res.send({
//     //             message: "Something went wrong !",
//     //             log: updated,
//     //             flag: "FAIL",
//     //         });
//     //     }
//     // });
// };

module.exports.pending_leaves = async (req, res) => {
    let filter = {};

    filter["pending_status"] = {
        $gt: 0,
    };

	let fields = {
		user_id: 1,
		pending_leaves: 1,
		pending_status: 1
	}

    const userLeaves = await UserLeave.find(filter).select(fields);
    return res.send({
        leaves: userLeaves,
        message: "Fetch Complete",
        flag: "SUCCESS",
    });
};

module.exports.leave_approve = (req, res) => {
    const { user_id, date } = req.body
    let filter = {}

    filter["user_id"] = user_id
    filter["pending_leaves.date"] = date

    UserLeave.findOne(filter, async (err, user_exist) => {
        if(err) return res.send({
            message: err.message,
            flag: 'FAIL'
        })

        if(!user_exist){
            return res.send({
                message: "Not found in DB",
                flag: "FAIL"
            })
        }

        if(user_exist){
            user_exist.pending_status = user_exist.pending_status - 1
            user_exist.pending_leaves = user_exist.pending_leaves.filter(each => each.date !== date)

            await user_exist.save()

            // deduct leave !!
            // add to leave dates !!

            return res.send({ message: "Leave approved", flag: 'SUCCESS' })
        }
    })
}