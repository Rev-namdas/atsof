const moment = require("moment")

/**
 * For getting dates of a specific month by current date
 * 
 * @method datesOfAMonthByCurrentDate
 * @returns Array of Dates of current month till today
 */
module.exports.datesOfAMonthByCurrentDate = () => {
	const firstDate = moment().startOf('month')
	const lastDate = moment()

	const difference = lastDate.diff(firstDate, "days")

	let arrOfDays = [{
		date: firstDate.format("DD-MM-YYYY"),
		unix: firstDate.unix()
	}]

	for(let i=0; i<difference; i++){
		const nextDate = firstDate.add(1, "days")

		const date = nextDate.format("DD-MM-YYYY")
		const unix = nextDate.unix()
		arrOfDays.push({ date, unix })
	}

	return arrOfDays
}