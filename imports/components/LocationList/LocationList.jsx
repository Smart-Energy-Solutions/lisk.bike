import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import R from 'ramda';

// Import models
import { Locations } from '/imports/api/locations.js'; 

// Import components
import LocationBlock from '../../containers/LocationBlock/LocationBlock';
import RaisedButton from '../RaisedButton/RaisedButton';

/**
 *  LocationList
 * 
 * @param {Object} locations
 * @param {Boolean} isEditable
 */
class LocationList extends Component {

  constructor(props) {
    super(props);

    if( ! Meteor.userId() ) this.context.history.push('/login', {redirectTo:'/admin'});
  }

  /**
   *  newLocation
   * 
   * Adds a new location to the database having the title "Locatie-naam"
   */
   newLocation() {
      if(this.props.newLocationHandler) {
          this.props.newLocationHandler();
      }
   }

  render() {
    self = this;
    return (
      <div style={s.base}>

        <div style={Object.assign({display: 'none'}, this.props.isEditable && {display: 'block'})}>

          <p style={s.paragraph}>
            Op deze pagina kun je de locaties beheren. Klik op <b>Nieuwe locatie</b> of <b><i>pas een titel aan</i></b>.
          </p>

          <RaisedButton onClick={this.newLocation.bind(this)}>Nieuwe locatie</RaisedButton>

        </div>

        {R.map((location) =>  <LocationBlock
                                key={location._id}
                                item={location}
                                isEditable={self.props.isEditable}
                                onClick={self.props.clickItemHandler} />
                              , this.props.locations)}

      </div>
    );
  }

}

var s = {
  base: {
    padding: '10px 20px',
    textAlign: 'center'
  },
  paragraph: {
    padding: '0 20px'
  }
}

LocationList.contextTypes = {
  history: propTypes.historyContext
}

LocationList.propTypes = {
  locations: PropTypes.array,
  isEditable: PropTypes.any,
  clickItemHandler: PropTypes.any,
  newLocationHandler: PropTypes.any,
};

LocationList.defaultProps = {
  isEditable: false
}

export default LocationList;
