import React, { Component, } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { RedirectTo } from '/client/main'
import { Settings } from '/imports/api/settings.js';
import L from 'leaflet'
import 'leaflet-search'

import './Leaflet.EasyButton.js';

// import { Objects } from '/imports/api/objects.js';

const styles = theme => ({
  base: {
    width: '100%',
    height: '100%',
    fontSize: 'default',
    lineHeight: 'default',
    background: '#e0e0e0',
    textAlign: 'right'
  }
});

class LocationsMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      map: undefined,
      watchId : undefined,
      trackingMarkersGroup: undefined,
      objectMarkersGroup: undefined,
    }
  }

  formatJSON(rawjson) {
    let json = {}, key, loc, disp = [];

    for(var i in rawjson) {
      key = rawjson[i].formatted_address;
      loc = L.latLng( rawjson[i].geometry.location.lat(), rawjson[i].geometry.location.lng() );
      json[key] = loc;// key,value format
    }

    return json;
  }

  componentDidMount() {
    // Init map
    let map = L.map('mapid', {
      zoomControl: true// Hide zoom buttons
    });

    // Add a leyer for search elements
    let markersLayer = new L.LayerGroup();
    map.addLayer(markersLayer);

    map.setView(this.props.startLocation, this.props.startZoom);

    map.on('moveend', this.mapChanged.bind(this));
    map.on('zoomend', this.mapChanged.bind(this));

    this.props.mapChanged ? this.props.mapChanged(map.getBounds()) : null

    // Now set the map view
    map.setView(this.props.startLocation, this.props.startZoom);

    // Le easy button
    let imagefile = '/files/IconsButtons/compass-black.svg' // 'https://einheri.nl/assets/img/home_files/compass-black.svg'
    L.easyButton( '<img src="'+ imagefile + '" style="width:22px;height:22px" />', this.toggleTrackUser.bind(this) ).addTo(map);

    var objectMarkersGroup = L.featureGroup().addTo(map);
    objectMarkersGroup.on("click", function (event) {
        var clickedMarker = event.layer;
        RedirectTo('/object/' + clickedMarker.bikeLocationId);
    }.bind(this));

    var trackingMarkersGroup = L.featureGroup().addTo(map);   // no tracking marker yet!
    this.toggleTrackUser()

    this.setState(prevState => ({ map: map,
                                  trackingMarkersGroup: trackingMarkersGroup,
                                  objectMarkersGroup: objectMarkersGroup,
                                }));

    setTimeout(this.mapChanged,1000);
  }

  initializeMap() {
    if ( ! this.props.settings)
      return;

    var settings = this.props.settings;

    if (settings.mapbox.userId.startsWith('<')) {
      console.warn(settings.mapbox.userId)
      return
    }

    // https://www.mapbox.com/api-documentation/#retrieve-a-static-map-image
    // const url = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
    const url = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}'

    L.tileLayer(url, {
      attribution: '<a href="http://mapbox.com">Mapbox</a> | <a href="http://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 22,
      id: settings.mapbox.style,  // https://www.mapbox.com/studio/tilesets/
      accessToken: settings.mapbox.userId
    }).addTo(this.state.map);

  }

  initializeObjectsMarkers() {
    // console.log("locationsmap.initializeObjectsMarkers objects %o", this.props.objects)

    if(!this.props.objects) return;
    
    // create custom icon
    var bikeIcon = L.icon({
        iconUrl: '/files/ObjectDetails/liskbike.png',
        iconSize: [32,32],
        iconAnchor: [16, 16],
        popupAnchor: null,
        shadowUrl: null,
        shadowSize: null,
        shadowAnchor: null
    });

    this.props.objects.map((object) => {
      if(object && object.asset && object.asset.location) {
        let location = object.asset.location;
        var marker = L.marker([location.latitude, location.longitude], {icon: bikeIcon, zIndexOffset: -900}); // bike object marker
        marker.objectId = object.id;
        // Check if marker exists
        if(marker._latlng === null)
          return;
        // markers.push(marker); // .bindPopup(location.title)
        this.state.objectMarkersGroup.addLayer(marker);
        // console.log("created marker %o", marker)
      }
    });
  }

  mapChanged(e) {
    // Send changed trigger to parent
    if(!this.state) return;
    if(!this.state.map) return;

    this.props.mapChanged ? this.props.mapChanged(this.state.map.getBounds()) : null
  }

  // ----------------------------------------------------------------------------
  // user location tracking related functions
  // ----------------------------------------------------------------------------
  trackSuccess(pos) {
    console.log('trackSuccess');

    const {coords} = pos
    let newLatLng = [coords.latitude, coords.longitude]

    var trackingMarkersGroup = this.state.trackingMarkersGroup;
    var marker = undefined;

    if (trackingMarkersGroup.getLayers().length==0) {
       // create a new tracking marker
      marker = L.circleMarker([0,0]);
      marker.zIndexOffset = -800; // use marker/tracking
      marker.bindPopup("<b>You are here</b>");
      trackingMarkersGroup.addLayer(marker)
    } else {
      marker = trackingMarkersGroup.getLayers()[0];
    }

    marker.setLatLng(newLatLng);

    if(!this.state.map.getBounds().contains(newLatLng)) {
      this.state.map.setView(newLatLng);
    }

    // for now: tracking is switched off after obtaining a single valid location
    // TODO:implement a toggle button for continuous tracking later on
    navigator.geolocation.clearWatch(this.state.watchId);
    this.setState(prevState => ({ watchId: undefined}));
  }

  trackError(err) {
    // alert('ERROR(' + err.code + '): ' + err.message);
    console.warn('ERROR(' + err.code + '): ' + err.message)
  }

  toggleTrackUser() {
    if(!navigator||!navigator.geolocation||!navigator.getCurrentPosition) return;
    
    if(this.state.watchId==undefined) {
      let options = {
        enableHighAccuracy: true,
        timeout: 1000,
        maximumAge: 0
      }

      var newid = navigator.geolocation.watchPosition(this.trackSuccess.bind(this), this.trackError.bind(this), options)
      this.setState(prevState => ({ watchId: newid}));
    } else {
      navigator.geolocation.clearWatch(this.state.watchId);
      this.setState(prevState => ({ watchId: undefined}));
    }
  }

  // ----------------------------------------------------------------------------
  // rendering
  // ----------------------------------------------------------------------------
  render() {
    const {classes} = this.props
    
    if(this.state.map) {
      this.initializeMap();
      // this.initializeLocationsMarkers();
      this.initializeObjectsMarkers();
    }

    return (
      <div id='mapid' className={classes.base} />
    );
  }
}

LocationsMap.propTypes = {
  // width: PropTypes.any,
  // height: PropTypes.any,
  locations: PropTypes.array,
  objects: PropTypes.array,
  mapboxSettings: PropTypes.object,
  mapChanged: PropTypes.func,
  clickItemHandler: PropTypes.any,
  startLocation: PropTypes.array,
  startZoom: PropTypes.number
};

LocationsMap.defaultProps = {
  // width: '100vw',
  // height: '50vh',
  clickItemHandler: '',
  startLocation: [52.088304, 5.107243],   // LCU
  startZoom: 15
}

export default withStyles(styles) (LocationsMap);
