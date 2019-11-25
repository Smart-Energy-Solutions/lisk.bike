const { APIClient } = require('@liskhq/lisk-client');
const UpdateBikeLocationTransaction = require('../transactions/update-bike-location');
const { getSettingsClientSide } = require('/imports/api/settings.js');
const { getTimestamp, getBike } = require('../_helpers.js');
const transactions = require('@liskhq/lisk-transactions');

import { Promise } from 'meteor/promise';

const updateBikeLocation = async (client, bikeaccount, latitude, longitude) => {
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

  const tx = new UpdateBikeLocationTransaction({
      asset,
      amount: 0, // transactions.utils.convertLSKToBeddows(bikeDeposit.toString()),
      senderPublicKey: bikeaccount.publicKey,
      recipientId: bikeaccount.address,
      timestamp: getTimestamp(),
  });

  tx.sign(bikeaccount.passphrase);

  return await client.transactions.broadcast(tx.toJSON());
}

const doUpdateBikeLocation = async (bikeaccount, latitude, longitude) => {
  const settings = await getSettingsClientSide();
  if(! settings) return false;

  const client = new APIClient([settings.bikecoin.provider_url]);
  if(! client) return false;
  
  const returnResult = updateBikeLocation(
        client,
        bikeaccount,
        latitude,
        longitude);
  returnResult.then(result => {
      // console.log(result)
  }, (err) => {
      console.error(err.errors[0].message)
  })

  return returnResult;
}

module.exports = {doUpdateBikeLocation}
