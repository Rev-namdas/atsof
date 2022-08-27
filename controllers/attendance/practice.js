const moment = require("moment")

const startdate = moment(1660327200 * 1000)
console.log('start', startdate.format("DD-MM-YYYY"));
const enddate = moment(1661536800 * 1000)
console.log('end', enddate.format("DD-MM-YYYY"));

const difference = enddate.diff(startdate, "days")
let arr = [startdate.format("DD-MM-YYYY")]

for(let i=0; i<difference; i++){
	const nextdate = startdate.add(1, "days")
	arr.push(nextdate.format("DD-MM-YYYY"))
}

console.log(arr);