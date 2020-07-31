// return white listed tokens for merkle tree

import { NeworkID } from '../config.js'

const whiteListMainnet = []

const whiteListRopsten = ["0x2f5Cc2E9353feB3cBe32d3ab1DED9e469fAD88C4", "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"]

let WhiteListedTokens

if(NeworkID === 1){
  WhiteListedTokens = whiteListMainnet
}else{
  WhiteListedTokens = whiteListRopsten
}


export default WhiteListedTokens
