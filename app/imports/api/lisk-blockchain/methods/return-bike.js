const { APIClient } = require('@liskhq/lisk-client');
const { getTimestamp, getBike } = require('../_helpers.js');
const ReturnBikeTransaction = require('../transactions/return-bike');
const transactions = require('@liskhq/lisk-transactions');
const { getSettingsClientSide } = require('/imports/api/settings.js');

import { Promise } from 'meteor/promise';

const returnBike = async (client, bikeaccount, latitude=undefined, longitude=undefined) => {
    // find the bike info on the blockchain
    console.log("bikeaccount %o", bikeaccount);
    console.log("returnBike method %o", latitude, longitude)
    
    let account = undefined;
    let accountlist = await client.accounts.get({address:bikeaccount.address});
    if(accountlist.data.length==1) {
      account = accountlist.data[0];
    } else {
      console.log("bike account not found. Please try again");
      return false;
    }

    let asset = {
        id: bikeaccount.address,
    }
    
    let prevlatitude = account.asset.location ? account.asset.location.latitude : 0;
    let prevlongitude = account.asset.location ? account.asset.location.longitude : 0;
    
    if(undefined==latitude) latitude=prevlatitude;
    if(undefined==longitude) longitude=prevlongitude;
    
    asset.location = {latitude, longitude};
    asset.prevlocation = {prevlatitude, prevlongitude};
    
    console.log("setting asset location to %o", asset.location);

    const tx = new ReturnBikeTransaction({
        asset,
        // amount: "0.1",// Give back the txfee to the renter
        senderPublicKey: bikeaccount.publicKey,
        recipientId: account.asset.rentedBy,
        timestamp: getTimestamp(),
    });

    tx.sign(bikeaccount.passphrase);
    
    return await client.transactions.broadcast(tx.toJSON());
}

const doReturnBike = async (bikeaccount, latitude=undefined, longitude=undefined) => {
  const settings = await getSettingsClientSide();
  if(!settings) return false;

  const client = new APIClient([settings.bikecoin.provider_url]);
  if(!client) return false;

  const returnResult = returnBike(
      client,
      bikeaccount,
      latitude,
      longitude
  );
  returnResult.then(result => {
      // console.log(result)
  }, (err) => {
      console.error("doReturnBike - error %o", err);
  })

  return returnResult;
}

module.exports = {doReturnBike}
