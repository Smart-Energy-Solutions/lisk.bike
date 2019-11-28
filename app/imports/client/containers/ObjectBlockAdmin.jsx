import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/DeleteForever';

import { Objects } from '/imports/api/objects.js';

const styles = theme => ({
  card: {
    boxSizing: 'border-box',
    position: 'relative',
    width: '22.5vmin', // '120px',
    height: '22.5vmin', // '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '2vmin',
    boxSizing: 'border-box',
    padding: '0.1vmin',
    '-moz-user-select': 'none',
    '-khtml-user-select': 'none',
    '-webkit-user-select': 'none',
    '-ms-user-select': 'none',
    'user-select': 'none',
    // -- old code
    // margin: theme.spacing.unit,
    // paddingLeft: 1.5 * theme.spacing.unit,
    background: 'white',
    // color: '#bcc1c5',
    // '&:hover': {
    //       color: 'white',
    //       border: '1px solid white'
    // },
    borderRadius: '10px',
    zIndex: 1,
  },
  poster: {
    boxSizing: 'border-box',
    flex: '6 6 auto',
    width: '90%',
    boxSizing: 'border-box',
    marginTop: '10px',
    marginBotton: '5px',
    height: 'calc(100%-1.1vmin)', // '120px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    background: 'white',
    backgroundSize: 'contain',
    backgroundRepeat:'no-repeat',
    backgroundPosition: 'center',
    border: '0.4vmin solid black',
    borderRadius: '1vmin',
    '-moz-user-select': 'none',
    '-khtml-user-select': 'none',
    '-webkit-user-select': 'none',
    '-ms-user-select': 'none',
    'user-select': 'none',
    zIndex: 1
  },
  title: {
    boxSizing: 'border-box',
    flex: '0 1 auto',
    width: '100%',
    textAlign: 'center',
    height: 'auto',
    whiteSpace: 'nowrap',
    paddingBottom: '1vmin',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '2.5vmin',
    // fontFamily: 'Fredoka One',
    marginTop: '0.2vmin'
    // border: '1px solid red',
  },
  state: {
    flex: '0 1 auto',
    boxSizing: 'border-box',
    width: '90%',
    textAlign: 'center',
    height: 'auto',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '2.5vmin',
    // fontFamily: 'Fredoka One',
    padding: '0.5vmin',
    marginTop: '0.5vmin',
    margin: '1vmin',
    border: '1px solid black',
    borderRadius: '1vmin'
  },
  buttons: {
    boxSizing: 'border-box',
    position:'absolute',
    zIndex:10,
    left:0,
    right: 0,
    top:'-2vmin',
    height: 'auto', // '3.5vmin',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    background: 'transparent',
    margin: 0,
    padding: 0,
  },
  menuitem: {
    boxSizing: 'border-box',
    // color: 'white',
    height: '5vmin',
    width: 'auto',
    zIndex: '100',
    backgroundColor: 'white',
    color: 'black',
    border: '0.2vmin solid black',
    borderRadius: '0.7vmin',
    // '&:hover': {
    //       color: 'white',
    // },
  },
});

class ObjectBlockAdmin extends Component {

  constructor(props) {
    super(props);
  }
    
  doHandler = (menuitem, handler) => (e) => {
    e.preventDefault();
    
    if(handler in this.props) {
      // console.log(`itemCompact  - calling ${handler} handler`);
      this.props[handler](menuitem);
    } else {
      console.warn(`itemCompact  - ${handler} handler not set by parent`);
    }
  }
  
  edithandler = (menuitem) => (e) => {
    e.preventDefault();
    
    if(this.props.edithandler) {
      this.props.edithandler(menuitem);
    } else {
      console.warning('itemCompact.edithandler - edithandler not set by parent');
    }
  }

  render() {
    // try {
      const { classes, object, zoom, adminmode, parentuuid } = this.props;
      
      if(undefined==object||undefined==object.lock) {
        return (null);
      }

      let imagelink='url(/files/ObjectDetails/liskbike.png)' ;
      let statetext = object.lock.locked? 'LOCKED': 'UNLOCKED';
      
      return (
          <div className={classes.card} style={{position: 'relative'}}>
            <div className={classes.poster} style={{backgroundImage: imagelink}} onClick={ this.doHandler(object, 'selecthandler') }/>
            <div className={classes.state} variant={'h6'} onClick={ this.doHandler(object, 'selecthandler') }>{statetext}</div>
            <div className={classes.title} variant={'h6'} onClick={ this.doHandler(object, 'selecthandler') }>{object.blockchain && object.blockchain.title||'??'}</div>
            { adminmode ?
                <div className={classes.buttons}>
                   <EditIcon className={classes.menuitem} title='Edit' onClick={this.doHandler(object, 'edithandler')} />
                   {
                     this.props.deletehandler ?
                        <DeleteIcon className={classes.menuitem} title='Delete' onClick={this.doHandler(object, 'deletehandler')} />
                      :
                        <div />
                   }
                </div>
              :
                null
            }
        </div>
      )
  }
}

ObjectBlockAdmin.propTypes = {
  object: PropTypes.object.isRequired,
  selecthandler: PropTypes.any,
  edithandler: PropTypes.any,
  deletehandler: PropTypes.any,
  adminmode: PropTypes.bool,
};

ObjectBlockAdmin.defaultProps = {
  object: undefined,
  selecthandler: undefined,
  edithandler: undefined,
  deletehandler: undefined,
  adminmode: false,
}

export default withStyles(styles)(withRouter(ObjectBlockAdmin));