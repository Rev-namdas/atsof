const moment = require("moment")

/**
 * For getting all dates of a specific month
 * 
 * @method datesOfAMonth
 * @param {Number} year year in number Ex: 2022 or 22
 * @param {Number} month month in number Ex: 09 or 9
 * @returns Array of Dates of mentioned month of the year
 */
module.exports.datesOfAMonth = (year, month) => {
	const totalDays = moment(`${year}-${month}`, "YYYY-MM").daysInMonth()
	let arrOfDays = []

	for(let eachDate=1; eachDate<=totalDays; eachDate++){
		const date = moment(`${year}-${month}`, "YYYY-MM").date(eachDate).format("DD-MM-YYYY")
		const unix = moment(`${year}-${month}`, "YYYY-MM").date(eachDate).unix()
		arrOfDays.push({ date, unix })
	}

	return arrOfDays
}