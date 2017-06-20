import { Settings } from '/imports/api/settings.js';
import { logwrite } from '/imports/api/log.js';

// used in the utility functions
import { Objects } from '/imports/api/objects.js';

export default class BikeCoin {
  // constants
  static initialSupply = 1000000
  static tokenName     = 'BikeCoin'
  static decimalUnits  = 2
  static tokenSymbol   = 'BC'

  static gasMargin = 100000
  static gasPrice = 20000000000

  // General purpose helpers
  static settings() {
    return Settings.findOne().bikecoin;
  }

  static newKeypair() {
    var bip39 = require("bip39")
    const seedPhrase = bip39.generateMnemonic()

    let wallet
    if(BikeCoin.settings().provider_url!='') {
       var HDWalletProvider = require("truffle-hdwallet-provider") // https://github.com/trufflesuite/truffle-hdwallet-provider
       var provider = new HDWalletProvider(seedPhrase, BikeCoin.settings().provider_url)
       wallet = {
         address: '0x' + provider.wallet.getAddress().toString("hex"),
         privatekey: seedPhrase,
       }
    } else {
      console.log('unable to create wallet - no provider url set');
      wallet = {
        address: '',
        privatekey:  ''
      }
    }

    return wallet
  }

  static web3(seedPhrase) { // note: we only need to supply seedPhrase when we need to sign a transaction!
    var HDWalletProvider = require("truffle-hdwallet-provider") // https://github.com/trufflesuite/truffle-hdwallet-provider
    const provider = new HDWalletProvider(seedPhrase, Settings.findOne().bikecoin.provider_url)
    var Web3 = require("web3")
    return new Web3(provider)
  }

  static bikeCoinsInstance(seedPhrase) {
    const { token_address, token_abi } = Settings.findOne().bikecoin
    const web3 = BikeCoin.web3(seedPhrase)
    return web3.eth.contract(JSON.parse(token_abi)).at(token_address)
  }

  static bikeCoinsBalance(address) {
    BikeCoin.bikeCoinsInstance().balanceOf(address, (err, nBikeCoins) => console.log(address, 'owns', nBikeCoins.toNumber() / Math.pow(10, this.decimalUnits), this.tokenSymbol))
  }

  static bikeCoinsBalanceOfUser(userId) {
    var aUser = Meteor.users.findOne(userId || Meteor.userId(), {'wallet.address':1});
    if(!aUser) return 0.0;

    return BikeCoin.bikeCoinsBalance(aUser.profile.wallet.address);
  }

  static bikeCoinsBalanceOfApp() {
    BikeCoin.bikeCoinsBalance(Settings.findOne().bikecoin.wallet.address)
  }

  static bikeCoinsSend(fromSeedPhrase, toAddress, amount=0.01) {
    const web3 = BikeCoin.web3(fromSeedPhrase)
    const fromAddress = web3.currentProvider.getAddress().toString('hex')
    // console.log(fromSeedPhrase, toAddress, amount, fromAddress)

    BikeCoin.bikeCoinsInstance(fromSeedPhrase).transfer(
      toAddress, Math.floor(amount * Math.pow(10, this.decimalUnits)),
      {from: fromAddress, gas: this.gasMargin + 21000, gasPrice: this.gasPrice},
      (err, result) => {
        if (err) { console.error(err); return; }
        console.log(fromAddress, 'sent', amount, this.tokenSymbol, 'to', toAddress, 'with txhash', result)
      }
    )
  }

  static bikeCoinsSendByApp(toAddress, amount=0.01) { // owner is the account the deployed the BikeCoin (this script/webapp)
    BikeCoin.bikeCoinsSend(Settings.findOne().bikecoin.wallet.privatekey, toAddress, amount)
  }

  // ETH related helpers
  static etherBalance(address) {
    const web3 = BikeCoin.web3()

    web3.eth.getBalance(address, (err, balance) => {
      if (err) { console.error(err); return; }
      console.log(address, 'owns', web3.fromWei(balance, 'ether').toNumber(), 'ETH')
    })
  }

  static etherBalanceOfApp() {
    BikeCoin.etherBalance(Settings.findOne().bikecoin.wallet.address)
  }

  static etherSend(fromSeedPhrase, toAddress, amount=0.01) {
    const web3 = BikeCoin.web3(fromSeedPhrase)
    const fromAddress = web3.currentProvider.getAddress().toString('hex')
    // console.log('fromAddress', fromAddress)

    web3.eth.sendTransaction(
      {from: fromAddress, to: toAddress, value: web3.toWei(amount, 'ether'), gas: this.gasMargin + 21000, gasPrice: this.gasPrice},
      (err, result) => {
        if (err) { console.error(err); return; }
        console.log(fromAddress, 'sent', amount, 'ETH to', toAddress, 'with txhash', result)
      }
    )
  }

  static etherSendByApp(toAddress, amount=0.01) { // owner is the account the deployed the BikeCoin (this script/webapp)
    BikeCoin.etherSend(Settings.findOne().bikecoin.wallet.privatekey, toAddress, amount)
  }

  static etherBalanceOfUser(userId) {
    var aUser = Meteor.users.findOne(userId || Meteor.userId(), {'wallet.address':1});
    if(!aUser) return 0.0;

    return BikeCoin.etherBalance(aUser.profile.wallet.address);
  }

  static etherBalanceOfObject(objectId) {
    var object = Objects.findOne(objectId, {'wallet.address':1});
    if(!object) return 0.0;

    return BikeCoin.etherBalance(object.wallet.address);
  }

} // end of class BikeCoin

global.BikeCoin = BikeCoin  // Client and ServerSide
