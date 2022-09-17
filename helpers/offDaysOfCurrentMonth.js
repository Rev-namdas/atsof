const moment = require('moment')

/**
 * List of Off Days of a month
 * 
 * @param {Number} dayoff day off number
 * @returns List of off days
 */
module.exports.offDaysOfCurrentMonth = (dayoff) => {
	const currentMonthYear = moment().startOf('month').format("YYYY-MM")
	const month = moment().startOf('month')
	const totalDays = month.daysInMonth()
	const dates = []

	for (let eachDate = 1; eachDate <= totalDays; eachDate++) {
		const currentDate = moment(currentMonthYear, "YYYY-MM").date(eachDate)
		
		if((currentDate.day() === dayoff) && (currentDate > moment())){
			dates.push({
				date: currentDate.unix(),
				label: currentDate.format("DD-MM-YYYY ddd"),
				details: "Day-Off"
			})
		}
	}

	return dates
}