const bl10 = require('./concox-bl10');

const net = require('net');
const simpleDDP = require("simpleddp"); // nodejs
const ws = require("isomorphic-ws");

let opts = {
    endpoint: "ws://localhost:3000/websocket",
    SocketConstructor: ws,
    reconnectInterval: 5000
};
const meteorserver = new simpleDDP(opts);
(async ()=>{
  console.log("connectiong to meteor server!");
  await meteorserver.connect();
  console.log("meteor server connected!");
  let objectsSub = meteorserver.subscribe("Objects");
  await objectsSub.ready();
  console.log("object subscription ready!");
  
  // let findres = await meteorserver.collection("Objects");
  // console.log("got objects %o", findres);
  // connection is ready here
})();

var resetsent = false;

var server = net.createServer(function(socket) {
  console.log('incoming connection from %s',  socket.remoteAddress);
  socket.on('data', function(data) {
		console.log('incoming data from %s', socket.remoteAddress);
    const buf = data.toString('hex');
    const cmdSplit = buf.split(/(?=7878|7979)/gi)
    cmdSplit.map( buf => {
      bl10.processSinglePacket(socket, buf, meteorserver);
    });
  });
	
  if(false==resetsent) {
    console.log("send command");
    // socket.write(bl10.createSendCommand('GPRSSET#'))
    // Server:1,app.lisk.bike,9020,0
    // socket.write(bl10.createSendCommand('SERVER,1,app.lisk.bike/api/liskbike,80,0#'))
		// socket.write(bl10.createSendCommand('UNLOCK#'))
    resetsent=true;
  }

	// socket.write('Echo server\r\n');
	// socket.pipe(socket);

  socket.on('error', function(data) {
    console.log("%o",data);
  })
});

// ---------------------------------------------------
// for now the bl10 server is parked in the meteor app
// so that I can use the mongodb for state storage
//
// later on when things run through the blockchain
// it can be moved to a separate process. This process
// can either run standalone or be controlled by using pm2
// commands issued by the meteor backend.

let port = 3005;                // listening port
let serverip = '0.0.0.0'; // external IP address for this server

console.log('starting concox BL10 server on %s:%s', serverip, port);
server.listen(port, serverip);