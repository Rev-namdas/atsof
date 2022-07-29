module.exports.date_to_unix = (val) => {
	const date = new Date(val)
	date.setHours(0)
	date.setMinutes(0)
	date.setSeconds(0)

	const timestamp = Math.floor(date / 1000)

	return timestamp
}