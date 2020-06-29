import { observable, action, decorate } from 'mobx'
import isMobile from './utils/isMobile'
import { fromWei } from 'web3-utils'

class MOBXStorage {
  web3 = null
  account = null
  SmartFunds = []
  SmartFundsOriginal = []
  SmartFundsCurrentPage = []
  FilterActive = false
  FilterInfo = ''
  TotalValue = 0
  TotalProfit = 0
  userTotalValue = 0
  userTotalProfit = 0
  filterOptions = null

  // Initializers
  initWeb3AndAccounts(_web3, accounts){
    this.web3 = _web3
    this.account = accounts
  }

  initSFList(_newList) {
    const initPageNumber = (isMobile()) ? 5 : 10

    this.SmartFundsOriginal = this.sortSFByValue(_newList)
    this.SmartFundsCurrentPage = this.sortSFByValue(_newList).slice(0, initPageNumber)
    this.SmartFunds = this.sortSFByValue(_newList).slice(0, initPageNumber)

    const { totalValue, totalProfit } = this.calculateValueAndProfit(this.SmartFundsOriginal)
    this.TotalValue = totalValue
    this.TotalProfit = totalProfit
  }

  // Update fund list with custom data
  updateSmartFundsListByFilter(smartFunds, filterOptions, filterKeys){
    const keys = filterKeys.join(',')
    this.FilterActive = true
    this.FilterInfo = `Filter funds by ${keys}`
    this.SmartFunds = smartFunds
    this.filterOptions = filterOptions
  }

  // Filters
  sortSFByValue(smartFunds){
    const sorted = smartFunds.slice().sort(function (a, b) {
    return a.profitInETH - b.profitInETH;
    })
    return sorted.reverse()
  }


  myFunds(owner){
    this.SmartFunds = this.SmartFundsOriginal.filter(fund => fund.owner.toLowerCase().includes(owner.toLowerCase()))
    this.FilterActive = true
    this.FilterInfo = "Filter funds by owner: " + owner.slice(0,-35) + "..."

    const { totalValue, totalProfit } = this.calculateValueAndProfit(this.SmartFunds)
    this.userTotalValue = totalValue
    this.userTotalProfit = totalProfit
  }

  myInvestments(address){
    this.SmartFunds = this.SmartFundsOriginal.filter(fund => fund.shares && fund.shares.includes(address))
    this.FilterActive = true
    this.FilterInfo = "Filter funds by investor: " + address.slice(0,-35) + "..."

    const { totalValue, totalProfit } = this.calculateValueAndProfit(this.SmartFunds)
    this.userTotalValue = totalValue
    this.userTotalProfit = totalProfit
  }

  // reset filters
  AllFunds(){
    this.SmartFunds = this.SmartFundsCurrentPage
    this.FilterActive = false
    this.FilterInfo = ""
    this.filterOptions = null
  }

  // pagination
  paginationChange(_smartFunds) {
    this.SmartFunds = _smartFunds
    this.SmartFundsCurrentPage = _smartFunds
  }

  // internal helper
  calculateValueAndProfit(SmartFunds){
    if(SmartFunds.length > 0){
      const reducer = (accumulator, currentValue) => Number(accumulator) + Number(currentValue)
      // get value
      const value = SmartFunds.map(fund => Number(fromWei(fund.valueInUSD)))
      const totalValue = Number(value.reduce(reducer)).toFixed(2)

      // get profit
      const profit = SmartFunds.map((fund) => {
        if(fund.profitInUSD > 0){
          return Number(fromWei(fund.profitInUSD))
        }else{
          return 0
        }
      })
      const totalProfit = Number(profit.reduce(reducer)).toFixed(2)

      return { totalValue, totalProfit }
    }
    else{
      return { totalValue:0, totalProfit:0 }
    }
  }
}


decorate(MOBXStorage, {
    SmartFunds: observable,
    SmartFundsOriginal: observable,
    FilterInfo: observable,
    FilterActive:observable,
    initSFList: action,
    initWeb3AndAccounts:action,
    paginationChange: action,
    myInvestments:action,
    myFunds: action,
    updateSmartFundsList:action
})

const MobXStorage = new MOBXStorage()

export default MobXStorage
