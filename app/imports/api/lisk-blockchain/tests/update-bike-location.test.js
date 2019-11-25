require('dotenv').config()
const { APIClient } = require('@liskhq/lisk-client');
const { getTimestamp, getProviderURL } = require('../_helpers.js');
const UpdateBikeLocationTransaction = require('../transactions/update-bike-location.js');
const fs = require('fs');


const updateBikeLocation = async (bikeaccount) => {
  const client = new APIClient([getProviderURL()]);
  
  // find the bike info on the blockchain
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
  
  // move bike around
  latitude = prevlatitude + Math.random() / 100;
  longitude = prevlongitude + Math.random() / 100;
  
  asset.location = {longitude,latitude};
  asset.prevlocation = {prevlongitude, prevlatitude};

  const tx = new UpdateBikeLocationTransaction({
    asset,
    senderPublicKey: bikeaccount.publicKey,
    recipientId: bikeaccount.address,
    timestamp: getTimestamp() // dateToLiskEpochTimestamp(new Date()),
  });

  tx.sign(bikeaccount.passphrase);

  return await client.transactions.broadcast(tx.toJSON());
}

if(process.argv.length!=3) {
  console.log("You need to specify the bike account to move the bike");
  console.log("usage node update-bike-location.test.js <bicycle account name>");
  return;
}

// Get 'accounts'
const bikeaccount = JSON.parse(fs.readFileSync('./accounts/'+process.argv[2]+'.json'));

if(undefined==bikeaccount) { console.log("Bicycle account not found"); return; }

console.log("Bike %s will be moved to a new random location", bikeaccount.address);

updateBikeLocation(bikeaccount)
.catch(error => {
  console.error(error);
});

