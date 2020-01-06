import BigNumber from 'bignumber.js'
import { toWei, fromWei } from 'web3-utils'

export const toWeiByDecimalsInput = (decimals, amount) => {
    try{
      const factor = 10 ** decimals
      amount = new BigNumber(amount)
      amount = amount.multipliedBy(factor)
      return String(amount.toFixed())
    }catch(e){
      return toWei(amount)
    }
}

 export const fromWeiByDecimalsInput = (decimals, amount) => {
    try{
      const factor = 10 ** decimals
      amount = new BigNumber(amount)
      amount = amount.dividedBy(factor)
      return String(amount.toFixed())
    }catch(e){
      return fromWei(amount)
 }
}
