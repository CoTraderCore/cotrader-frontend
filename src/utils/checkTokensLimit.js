// this function check tokens limit
// if there are limit, function check if destanationToken alredy in fund
// if destanation not in fund and there are limit, function throw any trade operation

import { MAX_TOKENS }  from '../config.js'

const checkTokensLimit = async (destanationToken, fundContract) => {
    let allTokens = await fundContract.methods.getAllTokenAddresses().call()
    allTokens = allTokens.map(v => v.toLowerCase());

    // check limit
    if(allTokens.length >= MAX_TOKENS){
    // allow tarde only if destanation alredy in fund
      if(!allTokens.includes(destanationToken.toLowerCase())){
        alert("Tokens limit exceeded")
        throw new Error("Tokens limit exceeded")
      }
    }
}

export default checkTokensLimit
