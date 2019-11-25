const net = require('net');

var resetsent = false;

var server = net.createServer(function(socket) {
  console.log('incoming connection from %s',  socket.remoteAddress);
  socket.on('data', Meteor.bindEnvironment(function(data) {
		console.log('incoming data from %s', socket.remoteAddress);
    const buf = data.toString('hex');
    const cmdSplit = buf.split(/(?=7878|7979)/gi)
    cmdSplit.map( buf => {
      processSinglePacket(socket, buf);
    });
  }));
	
  if(false==resetsent) {
    console.log("send command");
    // socket.write(createSendCommand('GPRSSET#'))
    // Server:1,app.lisk.bike,9020,0
    // socket.write(createSendCommand('SERVER,1,app.lisk.bike/api/liskbike,80,0#'))
		// socket.write(createSendCommand('UNLOCK#'))
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