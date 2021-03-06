import React, { Component, createRef} from 'react';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import { Map, TileLayer, Marker } from 'react-leaflet';
import { geolocated } from "react-geolocated";

const styles = theme => ({
  root: {
    boxSizing: 'border-box',
    position: 'relative',
    width: '100%',
    height: '50vmin',
    background: 'transparent',
    margin: '1vmin',
    display: 'flex',
    flexDirection: 'column'
  },
  map: {
    boxSizing: 'border-box',
    flex: '1 1 auto',
    border: '1px solid black',
    width: '100%',
    height: 'calc(100% - 40px)',
  },
  mapLocked: {
    boxSizing: 'border-box',
    flex: '1 1 auto',
    border: '1px solid black',
    width: '100%',
    height: '100%',
  },
  buttonbar: {
    boxSizing: 'border-box',
    flex: '0 0 auto',
    height: '5vh',
    display: 'flex',
    flexdirection: 'row',
    justifyContent: 'space-around'
  },
  button: {
    boxSizing: 'border-box',
    margin: '1vmin',
    height: '2.8vh',
    fontSize: 'x-small'
  }
});

class MiniMap extends Component {
  constructor(props) {
    super(props);

    let lat_lng = props.lat_lng;
    if((props.lat_lng[0]==999&&props.lat_lng[1]==999)||
       (props.lat_lng[0]==null&&props.lat_lng[1]==null)) {
      lat_lng = [52.088147, 5.106613];
    }
    
    this.state = {
      zoom: 13,
      refmap : React.createRef(),
      mapcenter: lat_lng,
      objectpos: lat_lng
    }
    
    const L = require('leaflet');
    this.objectIcon = L.icon({
        iconUrl: '/files/ObjectDetails/liskbike.png',
        iconSize: [32,32],
        iconAnchor: [16, 16],
        popupAnchor: null,
        shadowUrl: null,
        shadowSize: null,
        shadowAnchor: null
    });
    
    this.centerIcon = L.icon({
        iconUrl: '/files/MapSummary/iconfinder_pin_3855632.png',
        iconSize: [38,48],
        iconAnchor: [19,48],
        popupAnchor: null,
        shadowUrl: null,
        shadowSize: null,
        shadowAnchor: null
    });
  }
  
  updateMapCenter = () => {
    const map = this.state.refmap.current;
    if (map != null) {
      this.setState({mapcenter: map.viewport.center, zoom: map.viewport.zoom})
    }
  }

  moveHere = () => {
    const {isGeolocationAvailable, isGeolocationEnabled, coords} = this.props;

    if(isGeolocationAvailable==false||isGeolocationEnabled==false) return;
    if(coords) {
      this.setState({mapcenter: [coords.latitude, coords.longitude]})
    }
  }

  findBike = () => {
    this.setState((prevstate) => ({ mapcenter: this.state.objectpos }))
  }
  
  moveBike = () => {
    if(! Meteor.user) {
      alert('No user account found. Please wait a bit or reload the page.');
      return;
    }

    this.setState({ objectpos: this.state.mapcenter })

    let latitude = this.state.mapcenter[0];
    let longitude = this.state.mapcenter[1];
    Meteor.call('objects.updateBikeLocationUsingAddress', this.props.bikeAddress, latitude, longitude );
  }
  
  lockBike = () => {
    if(! Meteor.user) {
      alert('No user account found. Please wait a bit or reload the page.');
      return;
    }

    this.setState({ objectpos: this.state.mapcenter })
    const bikeAddress = this.props.bikeAddress;

    // We end the rental. This will lock the bike.
    let latitude = this.state.mapcenter[0];
    let longitude = this.state.mapcenter[1];
    Meteor.call('objects.lockBikeUsingAddress', this.props.bikeAddress, latitude, longitude );
  }
  
  render() {
    const { classes, lat_lng, objectislocked, isGeolocationAvailable, isGeolocationEnabled } = this.props; // lat_lng,
    const { refmap, mapcenter, reftilelayer, objectpos} = this.state;
    
    // console.log(objectpos);
    if(objectpos[0]==undefined) return null;
    
    return (
      <div className={classes.root}>
        <Map className={objectislocked? classes.mapLocked : classes.map}
          ref={refmap}
          center={mapcenter}
          zoom={this.state.zoom}
          useFlyTo={true}
          dragging={objectislocked==false}
          onDragEnd={this.updateMapCenter}
          onDrag={this.updateMapCenter}
          >
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker icon={this.objectIcon} position={{lat: objectpos[0], lng: objectpos[1]}}/>
          <Marker icon={this.centerIcon} position={{lat: mapcenter[0], lng: mapcenter[1]}}/>
        </Map>
        { objectislocked!=true ?
            <div className={classes.buttonbar}>
              { isGeolocationAvailable && isGeolocationEnabled?
                  <Button className={classes.button} variant="contained" onClick={this.moveHere.bind(this)}>U-R-HERE</Button>
                :
                  null
              }
              <Button className={classes.button} variant="contained" onClick={this.findBike.bind(this)}>FIND</Button>
              <Button className={classes.button} variant="contained" onClick={this.moveBike.bind(this)}>MOVE</Button>
              <Button className={classes.button} variant="contained" onClick={this.lockBike.bind(this)}>LOCK</Button>
            </div>
          :
            null
        }
      </div>
    );
    
    // TODO: implement move button -> works only for bikes that are locally created
    // because we need the wallet info: can't move someone else's bikes (can't sign transaction)

    // <Typography variant="h6">{'[' + objectpos[0] + ', '+  objectpos[1] + ']'}</Typography>
  }
}

MiniMap.propTypes = {
  bikeAddress: PropTypes.string,
  lat_lng: PropTypes.array,
  updatelocation: PropTypes.any,
  objectislocked: PropTypes.bool
};

MiniMap.defaultProps = {
  bikeAddress: "",
  lat_lng: [0,0],
  updatelocation: undefined,
  objectislocked: true
}

export default withStyles(styles) (geolocated()(MiniMap));
