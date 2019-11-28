require('dotenv').config()
var net = require('net');

if(process.argv.length!=4) {
  console.log("You need to port and address");
  console.log("usage node test-send.js port address");
  return;
}

var client = new net.Socket();
client.setNoDelay(true);
let port = process.argv[2];
let server = process.argv[3];

let hbtintervalms = 2000;
let reconnectintervalms = 5000;
let ncommands = 5

let cmd01 = new Buffer.from('787811010999999999999990360806420011eb280d0a','hex');
let cmd23 = new Buffer.from('78780b2304019d040001001485a90d0a','hex');
let cmd98 = new Buffer.from('79790080980000080355951092143820010008020408648497583202000a8931089218085466027f030010c020d562537fdcc722480a011591cbad040006c4a82807e90605000630303030303006001020572f52364b3f473050415811632d2b07001d47423131305f31305f413144455f4432335f52305f5630325f574946490002f8130d0a','hex');

let ndatasent = 0;
let timerid = false;

const connect = () => {
  client.connect(port, server, function() {
  	console.log('  - connected');
    client.write(cmd01);

    ndatasent = 0;
    timerid = setTimeout(senddata, hbtintervalms);
  });
}

const senddata = () => {
  if(ndatasent<ncommands) {
    if(Math.random()>0.6) {
      console.log('  - sending location [%s/%s]', ++ndatasent, ncommands);
      client.write(cmd98);
    } else {
      console.log('  - sending heartbeat [%s/%s]', ++ndatasent, ncommands);
      client.write(cmd23);
    }
    timerid = setTimeout(senddata, hbtintervalms);
  } else {
    client.destroy();
  }
}

client.on('data', function(data) {
	console.log('  - received: ' + data.toString('hex'));
});

client.on('close', function() {
	console.log('  - connection closed');
  console.log('  - Will reconnect in %s seconds', Math.round(reconnectintervalms/1000));
  
  if(timerid!=false) clearTimeout(timerid);
  timerid=false;

  timerid = setTimeout(connect, reconnectintervalms);
});

client.on('error', function(err) {
	console.log('  - connection error %s', err.message);
  console.log('  - Will reconnect in %s seconds', Math.round(reconnectintervalms/1000));
  
  if(timerid!=false) clearTimeout(timerid);
  timerid=false;

  timerid = setTimeout(connect, reconnectintervalms);
});

console.log('Testing lock connection to %s:%s', server, port);
connect();
