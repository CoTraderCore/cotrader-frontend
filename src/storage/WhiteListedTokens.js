// return white listed tokens for merkle tree
// TODO: GET This data from api

import { NeworkID } from '../config.js'

const whiteListMainnet = []

const whiteListRopsten = [
  "0x2f5Cc2E9353feB3cBe32d3ab1DED9e469fAD88C4",
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "0xc74bE418ADf788a04dB7d23E3916f332B74A9617",
  "0x98474564A00d15989F16BFB7c162c782b0e2b336",
  "0x63B75DfA4E87d3B949e876dF2Cd2e656Ec963466",
  "0xAa2A908Ca3E38ECEfdbf8a14A3bbE7F2cA2a1BE4",
  "0xab726e4664d1c28B084d77cD9be4eF18884e858d"
]

let WhiteListedTokens

if(NeworkID === 1){
  WhiteListedTokens = whiteListMainnet
}else{
  WhiteListedTokens = whiteListRopsten
}


export default WhiteListedTokens
