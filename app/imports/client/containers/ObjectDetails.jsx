import React, { Component, } from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';
import { withStyles } from '@material-ui/core/styles';
import { ClientStorage } from 'ClientStorage';

const transactions = require('@liskhq/lisk-transactions');

import { Settings, getSettingsClientSide } from '/imports/api/settings.js';

import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import RentBikeButton from '/imports/client/components/RentBikeButton';
import { getObjectStatus } from '/imports/api/lisk-blockchain/methods/get-object-status.js';
import MiniMap from '/imports/client/components/MiniMap';

import { Objects } from '/imports/api/objects.js';

const styles = theme => ({
  root: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    '-moz-user-select': 'none',
    '-khtml-user-select': 'none',
    '-webkit-user-select': 'none',
    '-ms-user-select': 'none',
    'user-select': 'none',
    background: 'transparent'
  },
  dialog: {
    width: '90%',
    height: 'auto',
    minHeight: '60vh',
    padding: '4vmin',
    marginTop: '5vmin',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    '-moz-user-select': 'none',
    '-khtml-user-select': 'none',
    '-webkit-user-select': 'none',
    '-ms-user-select': 'none',
    'user-select': 'none',
    backgroundColor: 'white',
    color: 'black',
  },
  actionbutton: {
    width: '20vh',
    height: '30px',
    margin: '1vmin'
  },
  infodiv: {
    backgroundColor: 'white',
    color: 'black',
    marginBottom: '1vmin'
  }
});

class ObjectDetails extends Component {

  constructor(props) {
    super(props);
    
    let timer = setTimeout(this.updateObjectStatus.bind(this), 1000);
    // let timer=false;
    this.state = {
      timer: timer,
      status: undefined
    }
  }
  
  componentWillUnmount() {
    if(this.state.timer!=false) {
      clearTimeout(this.state.timer);
    }
  }

  isBikeRentedToMe() {
    if(! this.state.status) return false;
    if(! ClientStorage.get('user-wallet')) return false;
    return this.state.status.rentedBy == ClientStorage.get('user-wallet').address;
  }
  
  async updateObjectStatus() {
    try {
      let newStatus = await getObjectStatus(
        this.props.settings.bikecoin.provider_url,
        this.props.objectId
      );
      if(! newStatus) {
        console.error(`Couldnt get object status for ${this.props.settings.bikecoin.provider_url} and ${this.props.objectId}`)
        return false;
      }
      let balance = 0;
      if(newStatus.balance) {
        balance = transactions.utils.convertBeddowsToLSK(newStatus.balance);
      }
      let deposit = 0;
      if(newStatus.asset.deposit) {
        deposit = transactions.utils.convertBeddowsToLSK(newStatus.asset.deposit);
      }
      this.setState((prevstate) => { return {
        status: newStatus && newStatus.asset,
        balance: balance,
        deposit: deposit
      } });
    } catch(ex) {
      console.error(ex);
    } finally {
      this.setState((prevstate) => {
        return {
          timer: setTimeout(this.updateObjectStatus.bind(this), 2000)
        }
      });
    }
  }

  render() {
    if(this.props.objectId==undefined) {
      return (null);
    }

    const { objectId, classes } = this.props;
    const { status, balance, deposit } = this.state;
    
    if(undefined==status) {
      return null;
    }

    let location = status.location || {latitude: 40, longitude: 10};
    let unlocked = status.rentedBy!=""&&status.rentedBy!=undefined;
    
    const pricePerHourInLsk = status ? transactions.utils.convertBeddowsToLSK(status.pricePerHour) : "0";
    const depositInLsk = status ? transactions.utils.convertBeddowsToLSK(status.deposit) : "0";

    return (
      <div className={classes.root}>
        <div className={classes.dialog}>
          <MiniMap
            lat_lng={[location.latitude, location.longitude]}
            objectislocked={unlocked==false}
            bikeAddress={objectId} />

          <Typography variant="h4" style={{backgroundColor: 'white', color: 'black'}}>
            {status.title}
          </Typography>

          <div hidden>
            <Typography variant="h6" style={{backgroundColor: 'white', color: 'black'}}>{objectId}</Typography>
            <Typography variant="subtitle1" style={{backgroundColor: 'white', color: 'black'}}>balance: {balance}</Typography>
            <Typography variant="subtitle1" style={{backgroundColor: 'white', color: 'black'}}>ownerId: {status.ownerId}</Typography>
            <Typography variant="subtitle1" style={{backgroundColor: 'white', color: 'black'}}>deposit: {deposit}</Typography>
            <Typography variant="subtitle1" style={{backgroundColor: 'white', color: 'black'}}>location: {location.longitude}, {location.latitude}</Typography>
          </div>
  
          { unlocked==true ?
                <>
                  <div align="center" variant="subtitle1" className={classes.infodiv}>
                    Rented by {status.rentedBy}.
                  </div>
                  <div align="center" variant="subtitle1" className={classes.infodiv}>
                    Move the map around to simulate a bike ride.
                  </div>
                  <div align="center" variant="subtitle1" className={classes.infodiv}>
                    Click LOCK to stop renting.
                  </div>
                </>
              :
              <>
                <div align="center" variant="subtitle1" className={classes.infodiv}>
                  Do you want to rent me?
                </div>
                <div align="center" variant="subtitle1" className={classes.infodiv}>
                  I cost {pricePerHourInLsk} BikeCoin per hour.
                </div>
                <div align="center" variant="subtitle1" className={classes.infodiv}>
                  To rent me, you need at least {depositInLsk} BikeCoin as deposit.
                </div>
                <RentBikeButton bikeId={this.props.objectId} depositInLSK={deposit} classes={classes} isDisabled={unlocked} />
              </>
          }
        </div>
      </div>
    );
  }
}

ObjectDetails.propTypes = {
  objectId: PropTypes.string,
  settings: PropTypes.object,
};

ObjectDetails.defaultProps = {
  objectId: undefined,
  settings: undefined,
}

export default withTracker((props) => {
    // console.log("display details for object %s", props.objectId)

    Meteor.subscribe('objects');
    Meteor.subscribe('settings');
    // Get settings
    let settings = getSettingsClientSide();
    if(!settings) {
      console.log("no settings available");
      return {};
    }

    // Return variables for use in this component
    return {
      objectId: props.objectId,
      settings: settings
    };
})(withStyles(styles) (ObjectDetails));
