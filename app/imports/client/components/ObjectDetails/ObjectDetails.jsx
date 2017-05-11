import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import R from 'ramda';
import { RedirectTo } from '/client/main'
import { StyleProvider } from '../../StyleProvider.js'

// Import components
import EditObject from '../../containers/EditObject/EditObject';
import RaisedButton from '../Button/RaisedButton.jsx'
import ObjectBlock from '../../containers/ObjectBlock/ObjectBlock';
import Button from '../Button/Button';
import CheckInCode from '../CheckInCode/CheckInCode';
import MapSummary from '../../MapSummary';
import CheckInOutProcessPlainKey from '../CheckInOutProcess/CheckInOutProcessPlainKey';
import CheckInOutProcessAxaELock from '../CheckInOutProcess/CheckInOutProcessAxaELock';
import CheckInOutProcessOpenKeylocker from '../CheckInOutProcess/CheckInOutProcessOpenKeylocker';
import CheckInOutProcessOpenBikelocker from '../CheckInOutProcess/CheckInOutProcessOpenBikelocker';
import CheckInOutProcessSkopeiLock from '../CheckInOutProcess/CheckInOutProcessSkopeiLock';
import ManageApiKeys from '../ManageApiKeys/ManageApiKeys';

class ObjectDetails extends Component {

  constructor(props) {
    super(props);
  }

  renderCheckInOutProcess() {
    if( ! this.props.object.lock ) return <div />;

    var validUser = (Meteor.userId()==this.props.object.state.userId)||this.props.isEditable;

    if(this.props.object.state.state=="inuse"&&!validUser) {
      return (
        <div style={s.base}>
          <ul style={s.list}>
            <li style={s.listitem,s.mediumFont}>IN GEBRUIK</li>
          </ul>
        </div>
      );
    } else if(this.props.object.state.state!="available"&&!validUser) {
      return (
        <div style={s.base}>
          <ul style={s.list}>
            <li style={s.listitem,s.mediumFont}>NIET BESCHIKBAAR</li>
          </ul>
        </div>
      );
    }

    var lockType = this.props.object.lock.type;

    if(lockType=='open-bikelocker')
      return <CheckInOutProcessOpenBikelocker
          object={this.props.object} isProvider={this.props.isEditable} locationId={this.props.location._id} />

    else if(lockType=='open-keylocker')
      return <CheckInOutProcessOpenKeylocker
          object={this.props.object} isProvider={this.props.isEditable} locationId={this.props.location._id} />

    else if(lockType=='axa-elock')
      return <CheckInOutProcessAxaELock
          object={this.props.object} isProvider={this.props.isEditable} locationId={this.props.location._id} />

    else if(lockType=='skopei-v1')
      return <CheckInOutProcessSkopeiLock
          object={this.props.object} isProvider={this.props.isEditable} locationId={this.props.location._id} />

    else
      return <CheckInOutProcessPlainKey
          object={this.props.object} isProvider={this.props.isEditable} locationId={this.props.location._id} />
  }

  render() {
    return (
      <div style={s.base}>

        <p style={s.intro}>
          <i><span dangerouslySetInnerHTML={{__html: this.props.location.title}} /></i>
        </p>

        <center>
          <MapSummary item={this.props.location} width={400} height={120}/>
        </center>

        <ObjectBlock
          item={this.props.object} />

        { this.props.isEditable?
          <EditObject objectId={this.props.object._id} />
          :null }

        { this.props.isEditable?
          <ManageApiKeys keyOwnerId={this.props.object._id} keyType="object" />
          :null }

        { this.renderCheckInOutProcess() }

      </div>
    );
  }
}

var s = StyleProvider.getInstance().checkInOutProcess;

ObjectDetails.propTypes = {
  object: PropTypes.object,
  location: PropTypes.object,
  isEditable: PropTypes.any,
};

ObjectDetails.defaultProps = {
  object: {},
  location: {},
  isEditable: false
}

export default ObjectDetails
