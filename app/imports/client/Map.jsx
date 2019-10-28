import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';
import L from 'leaflet'
import { Settings } from '/imports/api/settings.js';

// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
// navigator.geolocation.getCurrentPosition((geo)=>console.log(geo.coords.latitude, geo.coords.longitude))
myWatchId = undefined
myLatLng = [0,0]
myMap = undefined
myMarker = undefined

class Map extends Component {

  watchMyLatLng() {
    if (myWatchId !== undefined) { // already watching
      return
    }

    function success(pos) {
      const {coords} = pos
      myLatLng = [coords.latitude, coords.longitude]
      myMarker.setLatLng(myLatLng)
      // console.log('updated myMarker to', myLatLng)
    }

    function error(err) {
      console.warn('ERROR(' + err.code + '): ' + err.message)
    }

    options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }

    myWatchId = navigator.geolocation.watchPosition(success, error, options)
  }

  componentDidMount() {
    const {item} = this.props
    if (!item || !item.lat_lng || !item.length==2) {
      return
    }

    // create the map component
    const defaultStyle = "mapbox.streets" // mapbox.streets, mapbox.mapbox-streets-v7, mapbox.mapbox-terrain-v2, mapbox.satellite, mapbox.dark
    const defaultAccessToken = "pk.eyJ1IjoiZXJpY3ZycCIsImEiOiJjaWhraHE5ajIwNmRqdGpqN2h2ZXhqMnRsIn0.1FBWllDyQ_nSlHFE2jMLDA" // ericvrp Mapbox

    myMap = L.map('mapid').setView(item.lat_lng, 17)

    // https://www.mapbox.com/api-documentation/#retrieve-a-static-map-image
    // const url = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
    const url = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}'

    L.tileLayer(url, {
      attribution: '<a href="http://mapbox.com">Mapbox</a> | <a href="http://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 22,
      id: this.props.style,
      accessToken: this.props.accessToken
    }).addTo(myMap)

    myMarker = L.circleMarker(myLatLng).addTo(myMap)
    myMarker.bindPopup(`<b>You are here</b>`)

    this.watchMyLatLng()
  }

  render() {
    if (!this.props.item || !this.props.item.lat_lng) {
      return null
    }

    const from = ''
    const to = encodeURIComponent(this.props.item.address)
    const directionsUrl = `https://maps.google.com/maps/dir/${from}/${to}`

    return (
      <div>
        <div id='mapid' style={{width: this.props.width, height: this.props.height, maxWidth: '100%'}}></div>
      </div>
    )
  }
}

Map.defaultProps = {
  width: window.innerWidth,
  height: window.innerHeight-32,
  item: {
    address: 'Jaarbeursplein, Utrecht, Netherlands',
    title: 'Seats2meet',
    description: 'Utrecht CS',
    lat_lng: [52.088304, 5.107243]
  },
  style: "mapbox.streets" ,
  accessToken: "pk.eyJ1IjoiZXJpY3ZycCIsImEiOiJjaWhraHE5ajIwNmRqdGpqN2h2ZXhqMnRsIn0.1FBWllDyQ_nSlHFE2jMLDA"
}

export default withTracker((props) => {
  Meteor.subscribe('settings');

  var settings = Settings.findOne();

  return {
      style: settings.mapbox.style,
      accessToken: settings.mapbox.userId
  };
})(Map);


// export default Map
