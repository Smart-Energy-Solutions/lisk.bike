const { BigNum } = require('@liskhq/bignum');
const { TransactionError } = require('@liskhq/lisk-transactions');

module.exports = {
    BikeValidator: {
      id: (transactionId, param) => (param && typeof param === 'string' && param.length > 0)
        ? true
        : new TransactionError('Missing or invalid "asset.id" defined on transaction', transactionId, '.asset.id', param, 'A string'),
      pricePerHour: (transactionId, param) => {
        try {
            const pricePerHour = new BigNum(param);
            return pricePerHour.gte(0);
        } catch(err) {
            return new TransactionError('Missing or invalid "asset.pricePerHour" defined on transaction', transactionId, '.asset.pricePerHour', param, 'A valid BigNum string')
        }
      },
      deposit: (transactionId, param) => {
        try {
            const deposit = Number(param);
            return deposit >= 0;
        } catch(err) {
            return new TransactionError('Missing or invalid "asset.deposit" defined on transaction', transactionId, '.asset.deposit', param, 'A valid BigNum string')
        }
      },
      rentedBy: (transactionId, param) => {
      },
      cypheredLocation: (transactionId, param) => {
        try {
            return typeof param.latitude === 'string' && param.latitude.length > 0
            && typeof param.latitude === 'string' && param.latitude.length > 0;
        } catch(err) {
            return new TransactionError('Missing or invalid "asset.latitude" or "asset.longitude" defined on transaction', transactionId, '.asset.latitude | longitude', param, 'A valid cyphered string')
        }
      },
      location: (transactionId, param) => {
        try {
            // new BigNum(param.latitude);
            // new BigNum(param.longitude);
            return true;
        } catch(err) {
            return new TransactionError('Missing or invalid "asset.latitude" or "asset.longitude" defined on transaction', transactionId, '.asset.latitude | longitude', param, 'A valid BigNum string')
        }
      }
  }
};
