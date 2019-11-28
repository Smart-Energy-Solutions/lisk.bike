// imports for the meteor / mongodb connection server
const simpleDDP = require("simpleddp"); // nodejs
const ws = require("isomorphic-ws");
const { APIClient } = require('@liskhq/lisk-client');

// imports for the bl10 server
const bl10 = require('./concox-bl10');
const net = require('net');

// globals
let meteorserver = undefined; // meteor server global instance
let bikeapiserver = undefined; // bike api server global instance
let apiclient = undefined;

const startMeteorServer = async (endpoint="ws://localhost:3000/websocket") => {
  // create a connection to the meteor mongo database
  // we need this to get the wallet info for the
  // incoming lock commands so we can do transactions
  let opts = {
      endpoint: endpoint,
      SocketConstructor: ws,
      reconnectInterval: 5000
  };
  meteorserver = new simpleDDP(opts);

  console.log("connectiong to meteor server!");
  await meteorserver.connect();
  meteorserver.on('error', function(data) {
    console.log("meteor server error - %o",data);
  })
  
  console.log("meteor server connected!");
  let objectsSub = await meteorserver.subscribe("objects").ready();
  console.log("object subscription ready!");

  let settingsSub = await meteorserver.subscribe("settings").ready();
  console.log("setting subscription ready!");
  
  const filterfunc = (settings=>{return true })
  let settings = await meteorserver.collection("settings").filter(filterfunc).fetch();
  if(settings.length>0) {
    blockchainproviderurl = settings[0].bikecoin.provider_url;
    apiclient = new APIClient([blockchainproviderurl]);
    
    console.log("initialized blockchain api client @ %s", blockchainproviderurl);
  } else {
    console.warn("unable to access system settings. No blockchain api client available");
  };
};

// this is the server that handles the incoming connections
// from the bl10 locks

(async () => {
  await startMeteorServer()
  
  bl10.startBikeApiServer(meteorserver, apiclient);
  
  setTimeout(bl10.checkRentalState, 5000);
})();



