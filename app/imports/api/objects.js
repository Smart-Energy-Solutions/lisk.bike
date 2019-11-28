import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo';

import { CoinSchema } from '/imports/api/bikecoinschema.js';
import { getSettingsServerSide } from '/imports/api/settings.js';

import { getTimestamp } from '/imports/api/lisk-blockchain/_helpers.js';
import { doReturnBike } from '/imports/api/lisk-blockchain/methods/return-bike.js';
import { doUpdateBikeLocation } from '/imports/api/lisk-blockchain/methods/update-bike-location.js';

const { getAddressFromPublicKey, getKeys } = require('@liskhq/lisk-cryptography');
const BigNum = require('@liskhq/bignum');
const { Mnemonic } = require('@liskhq/lisk-passphrase');
const { APIClient } = require('@liskhq/lisk-client');
const transactions = require('@liskhq/lisk-transactions');

const CreateBikeTransaction = require('./lisk-blockchain/transactions/create-bike.js');
const { doCreateAccount } = require('./lisk-blockchain/methods/create-account.js');

export const Objects = new Mongo.Collection('objects');

export const LiskSchema = new SimpleSchema({
  id: {
    type: String,
    label: "Asset ID",
  },
  title: {
    type: String,
    label: "Bike title",
  },
  description: {
    type: String,
    label: "Bike description",
  },
  ownerId: {
    type: String,
    label: "Owner ID",
  },
  lat_lng: {
    type:   Array,
    label: "Last GPS location",
    maxCount: 2
  },
  'lat_lng.$': {
    type: Number,
    decimal: true,
    optional: true
  },
  pricePerHourInLSK: {
    type: Number,
    label: "Price per hour (LSK)",
    defaultValue: 1
  },
  depositInLSK: {
    type: Number,
    label: "Deposit (LSK)",
    defaultValue: 29
  },
  rentedBy: {
    type: String,
    label: "Renter ID"
  },
  rentalStartDatetime: {
    type: Date,
    label: "Start Date/Time",
    optional: true
  },
  rentalEndDatetime: {
    type: Date,
    label: "End Date/Time",
    optional: true
  }
});

export const LockSchema = new SimpleSchema({
  locktype: {
    type: String,
    label: "Lock type",
    max: 32
  },
  lockid: {
    type: String,
    label: "Lock ID",
  },
  lat_lng: {
    type:   Array,
    label: "Last GPS location",
    maxCount: 2
  },
  'lat_lng.$': {
    type: Number,
    decimal: true,
    optional: true
  },
  lat_lng_timestamp: {
    type: Date,
    label: "Last lock state change",
  },
  state_timestamp: {
    type: Date,
    label: "Last lock state change",
  },
  locked: {
    type: Boolean,
    label: "Locked state",
  },
  battery: {
    type: Number,
    decimal: true,
    label: "Battery Voltage",
  },
  charging: {
    type: Boolean,
    label: "Charging state",
  },
});

export const ObjectsSchema = new SimpleSchema({
  blockchain: {
    type: LiskSchema
  },
  wallet: {
    type: CoinSchema
  },
  lock: {
    type: LockSchema
  }
});

if (Meteor.isServer) {
  Meteor.publish('objects', function objectsPublication() {
    return Objects.find();
  });
}

export const createObject = () => {
  // set SimpleSchema.debug to true to get more info about schema errors
  SimpleSchema.debug = true

  const words = Mnemonic.generateMnemonic().split(" ");
  // Create object title
  const title = words[0] + " " + words[1];

  // Set object data
  var data = {
    blockchain: {
      id: '',
      title: title,
      description: '',
      ownerId: '',
      lat_lng: [0,0],
      pricePerHourInLSK: 1,
      depositInLSK: 20,
      rentedBy: ''
    },
    lock: {locktype: 'concox-bl10',
           lockid: '',
           lat_lng: [999,999],
           lat_lng_timestamp: new Date(),
           
           state_timestamp: new Date(),
           locked: false,
           battery: 0,
           charging: false
          },
    wallet: { passphrase :  '',
              privateKey :  '',
              publicKey : '',
              address :  '' }
  }
  
  // assign new keypair to object
  const passphrase = Mnemonic.generateMnemonic();
  const { privateKey, publicKey } = getKeys(passphrase);
  const address = getAddressFromPublicKey(publicKey);
  
  data.wallet = {
    passphrase,
    privateKey,
    publicKey,
    address
  };
  
  try {
    var context = ObjectsSchema.newContext();
    check(data, ObjectsSchema);
  } catch(ex) {
    console.log('Error in data: ',ex.message );
    return;
  }

  return data;
}

if(Meteor.isServer) {
  export const doServerUpdateBikeLocation = (bikeAddress, newLatitude, newLongitude) => {
    let object = Objects.findOne({'wallet.address': bikeAddress});
    
    if(object==undefined) {
      console.log('no object found with address %s', bikeAddress);
      
      return {
        result: true,
        message: 'You can only move your own bikes!'
      }
    }
    
    doUpdateBikeLocation(object.wallet, newLatitude, newLongitude).then(res => {
      console.log(res)
    }).catch(err => {
      console.error(err)
    });
    
    return {
      result: true,
      message: 'Bike location updated'
    }
    
    return ;
  }
  
  const doApplyChanges = (_id, changes, apitoken=false) => {
    // Make sure the user is logged in or an api token is specified
    // TODO: create api token field in object, use that token
    if ((! Meteor.userId())&&apitoken!="keepcycling!!") {
      console.log('incoming request from anonymous user rejected');
      throw new Meteor.Error('not-authorized');
    }
    
    let object = Objects.findOne(_id);
    if(object) {
      let title = (changes['blockchain.title'] || object.blockchain && object.blockchain.title || "unnamed object");
      
      // if(object.title!=title && "title" in changes == false) {
      //   // blockchain title is leading
      //   changes['title'] = title
      // }
      
      SimpleSchema.debug = true
      var context =  ObjectsSchema.newContext();
      if(context.validate({ $set: changes}, {modifier: true} )) {
        // apply changes
        Objects.update(_id, {$set: Object.assign({},
          changes,
        )});
        console.log('Object ' + title + ' updated');

        return {
          result: object,
          message: 'Object ' + title + ' updated',
          id: object._id
        }
      } else {
        console.log("invalid data %s", JSON.stringify(context,0,2));
        
        return {
          result: false,
          message: 'Object ' + title + ' contains invalid data',
          id: object._id
        }
      };
    } else {
      // make sure that no object exists with same title / category
      object = Objects.findOne({'blockchain.title': changes.title})
      if(object) {
        return {
          result: object,
          message: 'There is already an object with this title registered (' + changes.title + ')',
          id: object._id
        }
      }
      
      object = Object.assign({}, createObject(), changes);
      Objects.insert(object);
      return {
        result: object,
        message: 'Object ' + changes.title + ' created',
      }
    }
  }

  

  Meteor.methods({
    'objects.createnew'() {
      console.log("calling createnew")
      let newObject = createObject();
      let newId = Objects.insert(newObject);
      return { _id: newId }
    },
    'objects.applychanges'(_id, changes) {
      return doApplyChanges(_id, changes);
    },
    'objects.remove'(objectId){
      var object = Objects.findOne(objectId);

      Objects.remove(objectId);

      var description = 'Object ' + object.blockchain.title + ' was removed';
      console.log(description);
    },
    async 'objects.registeronblockchain'(objectId){
      
      var object = Objects.findOne(objectId);
      
      if(object.blockchain.title=='') {
        return { result: false, message: 'please provide a title for this object!'}
      } else if(object.blockchain.description=='') {
        return { result: false, message: 'please provide a description for this object!'}
      }
      
      let settings = await getSettingsServerSide();
      const client = new APIClient([settings.bikecoin.provider_url]);

      const defaultlocation = [52.088147, 5.106613]
      // Create tx
      const tx = new CreateBikeTransaction({
        senderPublicKey: settings.bikecoin.wallet.publicKey,
        recipientId: object.wallet.address,
        timestamp: getTimestamp(),
        asset: {
          id: object.wallet.address,
          title: object.blockchain.title,
          description: object.blockchain.description,
          ownerid: settings.bikecoin.wallet.address,
          pricePerHour: transactions.utils.convertLSKToBeddows(object.blockchain ? Number(object.blockchain.pricePerHourInLSK).toString() : Number(object.lisk.pricePerHourInLSK)),
          deposit: transactions.utils.convertLSKToBeddows(object.blockchain ? Number(object.blockchain.depositInLSK).toString() : Number(object.lisk.depositInLSK)),
          latitude: defaultlocation[0],
          longitude: defaultlocation[1]
        }
      });
      console.log("create transaction %o", tx);

      // Sign transaction
      tx.sign(settings.bikecoin.wallet.passphrase);
      
      // Broadcast the tx to the blockchain
      const broadcastTx = client.transactions.broadcast(tx.toJSON());
      
      broadcastTx.then(() => {
        Objects.update(objectId, {$set: {'blockchain.id': object.wallet.address}});
      })
      .catch(error => {
        console.error(error);
      });
      
      return { result: true, message: 'registration transaction has been sent to the blockchain!'}
    },
    'objects.lockBikeUsingAddress'(bikeAddress, latitude, longitude) {
      // find corresponding bike account
      let bikeobject = Objects.findOne({'wallet.address': bikeAddress});
      if(bikeobject==undefined) {
        console.error()
        return {
          result: true,
          message: 'Unable to return this bicycle! This is not one of my bicycles.'
        }
      }
      
      doReturnBike(bikeobject.wallet, latitude, longitude).then(res => {
        console.log(res)
      }).catch(err => {
        console.error(err)
      });
      return {
        result: true,
        message: 'Bike locked.'
      }
    },
    'objects.lockBikeUsingLockId'(lockid, latitude, longitude) {
      // find corresponding bike account
      let bikeobject = Objects.find({'lock.lockid': lockid});
      if(bikeobject==undefined) {
        console.error()
        return {
          result: true,
          message: 'Unable to return this bicycle! This is not one of my bicycles.'
        }
      }
      
      doReturnBike(bikeobject.wallet, latitude, longitude).then(res => {
        console.log(res)
      }).catch(err => {
        console.error(err)
      });
      return {
        result: true,
        message: 'Bike locked.'
      }
    },
    'objects.updateBikeLocation'(bikeAddress, latitude, longitude) {
      doServerUpdateBikeLocation(bikeAddress, latitude, longitude);
    },
    'bl10.reconnect'(id) {
      let timestamp = new Date();
      console.log('bl10.reconnect call for lock %s / %s', id, timestamp.toLocaleString());
    },
    'bl10.updateinfo'(id, info, apitoken=false) {
      let timestamp = new Date();
      // console.log('bl10.updateinfo call for lock %s / %s / %o', id, timestamp.toLocaleString(), info);
      console.log('bl10.updateinfo call for lock %s / %s', id, timestamp.toLocaleString());
      
      let object = Objects.findOne(id);
      if(object) {
        // update info serverside
        let changes = {
          'lock.state_timestamp' : new Date(),
          'lock.locked': info.locked,
          'lock.charging': info.charging,
          'lock.battery': info.voltage,
          // 'lock.gsmstrength': info.gsmstrength,
          // 'lock.gpspositioning': info.gpspositioning
        }

        doApplyChanges(id, changes, apitoken);
      } else {
        console.log("unable to find lock with id %s", id)
      }
    },
    'bl10.setlocked'(id, locked, apitoken=false) {
      let timestamp = new Date();
      // console.log('bl10.updateinfo call for lock %s / %s / %o', id, timestamp.toLocaleString(), info);
      console.log('bl10.setlocked %s call for lock %s / %s', locked, id, timestamp.toLocaleString());
      
      let object = Objects.findOne(id);
      if(object) {
        // update info serverside
        let changes = {
          'lock.state_timestamp' : new Date(),
          'lock.locked': locked,
        }

        doApplyChanges(id, changes, apitoken);
      } else {
        console.log("unable to find lock with id %s", id)
      }
    },
    'bl10.updatebikelocation'(id, latitude, longitude, apitoken=false) {
      let timestamp = new Date();
      console.log('bl10.updateBikeLocation call for lock %s / %s / [%s,%s]',
        id, timestamp.toLocaleString(), latitude, longitude);
        
        let changes = {
          'lock.state_timestamp' : new Date(),
          'lock.lat_lng': [latitude, longitude],
          // 'lock.gsmstrength': info.gsmstrength,
          // 'lock.gpspositioning': info.gpspositioning
        }

        // find lock blockchain
        let object = Objects.findOne(id);
        if(object) {
          doApplyChanges(id, changes, apitoken || false);
        } else {
          console.log("unable to find lock with id %s", id)
        }
    }
    
  });
}
