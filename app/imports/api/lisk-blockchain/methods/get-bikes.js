const { APIClient } = require('@liskhq/lisk-client');
const transactions = require('@liskhq/lisk-transactions');

const getObjectStatus = async (client, id) => {
  if(isNaN(id)) {
    console.error('You called getObjectStatus in get-bikes.js, but the id/address you sent was incorrect.')
  }
  try {
    let bikestatus = await client.accounts.get({address:id});
    if(bikestatus.data.length==1) {
      return bikestatus.data[0];
    } else if(bikestatus.data.length>1) {
      return false;
    } else {
      return false;
    }
  } catch(ex) {
    console.error('get-bikes.getObjectStatus: error %o', ex)
    return false;
  }
}

const validateBike = (bike) => {
  if(bike.id == 'NaN')
    return false
  return true
}

export const getAllBikes = async (providerUrl) => {
  try {
    if(undefined==providerUrl) return [];
    const client = new APIClient([providerUrl]);
    let createbiketxs = await client.transactions.get({ type: '1001' });
    bikes=[];
    for(let i=0; i<createbiketxs.data.length;i++) {
      // Validate that bike object is valid
      if(validateBike(createbiketxs.data[i].asset)) continue; else break
      // Get bike status
      let status = await getObjectStatus(client, createbiketxs.data[i].asset.id);
      bikes.push({
        id: createbiketxs.data[i].asset.id,
        title: createbiketxs.data[i].asset.title,
        balance: transactions.utils.convertBeddowsToLSK(status.balance),
        asset: status.asset
      });
    }
    
    return bikes;
  } catch(ex) {
    console.error('get-bikes.getAllBikes: error %o', ex)
    return [];
  }
}
