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
  }


  // Filters
  sortSFByValue(smartFunds){
    const sorted = smartFunds.slice().sort(function (a, b) {
    return a.profit - b.profit;
    })
    return sorted.reverse()
  }

  searchFund(name){
    if(name !== ''){
      this.SmartFunds = this.SmartFundsOriginal.filter(fund => fund.name.toLowerCase().includes(name.toLowerCase()))
      this.FilterActive = true
      this.FilterInfo = "Filter funds by name: " + name
    }else{
      this.SmartFunds = this.SmartFundsCurrentPage
      this.FilterActive = false
      this.FilterInfo = ""
    }
  }

  searchFundByManager(address){
    if(address !== ''){
      this.SmartFunds = this.SmartFundsOriginal.filter(fund => fund.owner.toLowerCase().includes(address.toLowerCase()))
      this.FilterActive = true
      this.FilterInfo = "Filter funds by manager: " + address.slice(0,-35) + "..."
    }else{
      this.SmartFunds = this.SmartFundsCurrentPage
      this.FilterActive = false
      this.FilterInfo = ""
    }
  }

  searchFundByValue(value){
    if(value !== 0){
      this.SmartFunds = this.SmartFundsOriginal.filter(fund => fromWei(fund.value) >= fromWei(value))
      this.FilterActive = true
      this.FilterInfo = "Filter funds by value: " + fromWei(value)
    }else{
      this.SmartFunds = this.SmartFundsCurrentPage
      this.FilterActive = false
      this.FilterInfo = ""
    }
  }

  searchFundByProfit(value){
    if(value !== 0){
      this.SmartFunds = this.SmartFundsOriginal.filter(fund => fromWei(fund.profit) >= fromWei(value))
      this.FilterActive = true
      this.FilterInfo = "Filter funds by profit: " + fromWei(value)
    }else{
      this.SmartFunds = this.SmartFundsCurrentPage
      this.FilterActive = false
      this.FilterInfo = ""
    }
  }

  searchFundByProfitPercent(percent){
    if(percent !== 0){
      this.SmartFunds = this.SmartFundsOriginal.filter(fund =>
      Number(fund.profit) !== 0 && parseFloat(fromWei(fund.profit)) >= parseFloat(fromWei(fund.value)) / 100 * parseFloat(percent))

      this.FilterActive = true
      this.FilterInfo = "Filter funds by profit percent: " + percent
    }else{
      this.SmartFunds = this.SmartFundsCurrentPage
      this.FilterActive = false
      this.FilterInfo = ""
    }
  }

  myFunds(owner){
    this.SmartFunds = this.SmartFundsOriginal.filter(fund => fund.owner.toLowerCase().includes(owner.toLowerCase()))
    this.FilterActive = true
    this.FilterInfo = "Filter funds by owner: " + owner.slice(0,-35) + "..."
  }

  myInvestments(address){
    this.SmartFunds = this.SmartFundsOriginal.filter(fund => fund.shares && fund.shares.includes(address))
    this.FilterActive = true
    this.FilterInfo = "Filter funds by investor: " + address.slice(0,-35) + "..."
  }

  // reset filters
  AllFunds(owner){
    this.SmartFunds = this.SmartFundsCurrentPage
    this.FilterActive = false
    this.FilterInfo = ""
  }

  // pagination
  paginationChange(_smartFunds) {
    this.SmartFunds = _smartFunds
    this.SmartFundsCurrentPage = _smartFunds
  }
}


decorate(MOBXStorage, {
    SmartFunds: observable,
    SmartFundsOriginal: observable,
    FilterInfo: observable,
    initSFList: action,
    initWeb3AndAccounts:action,
    paginationChange: action,
    searchFund: action,
    searchFundByManager:action,
    searchFundByValue:action
})

const MobXStorage = new MOBXStorage()

export default MobXStorage
