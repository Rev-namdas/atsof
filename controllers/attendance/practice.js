const moment = require("moment")

/**
 * For getting dates of a specific month by end date
 * 
 * @method datesOfAMonthByEndDate
 * @param {Unix} end_date unix timestamp
 * @returns Array of Dates of current month till end date
 */
const datesOfAMonthByEndDate = (end_date) => {
	const firstDate = moment().startOf('month')
	const lastDate = moment(end_date * 1000)

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

	console.log(arrOfDays);
	return arrOfDays
}

datesOfAMonthByEndDate(1661676825)