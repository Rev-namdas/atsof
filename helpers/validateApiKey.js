module.exports.validateApiKey = (keys) => {
	const errors = [null, undefined, ""]

	const apiKeys = Object.keys(keys)

	for(let each of apiKeys){
		if(errors.includes(keys[each])){
			return false
		}
	}

	return true
}