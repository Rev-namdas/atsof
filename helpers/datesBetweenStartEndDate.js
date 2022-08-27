const moment = require("moment")

/**
 * For Finding Dates Between Two Dates
 * 
 * @method datesBetweenStartEndDate
 * @param {Unix} start_date Unix timestamp of start date
 * @param {Unix} end_date Unix timestamp of end date
 * @returns Arrays of Dates in between two dates
 */
module.exports.datesBetweenStartEndDate = (start_date, end_date) => {
	const startDate = moment(start_date * 1000)
	const endDate = moment(end_date * 1000)
	
	const difference = endDate.diff(startDate, "days")
	let dates = [{
		date: startDate.format("DD-MM-YYYY"),
		unix: startDate.unix()
	}]
	
	for(let i=0; i<difference; i++){
		const nextDate = startDate.add(1, "days")
		dates.push({
			date: nextDate.format("DD-MM-YYYY"),
			unix: nextDate.unix()
		})
	}
	
	return dates
}
