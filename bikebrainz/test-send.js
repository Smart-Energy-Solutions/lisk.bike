require('dotenv').config()
const util = require('./concox-bl10-util')
const net = require('net');

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
let ncommands = 50

let cmd01 = new Buffer.from('787811010999999999999990360806420011eb280d0a','hex');
let cmd23 = new Buffer.from('78780b2304019d040001001485a90d0a','hex');
let cmd32 = new Buffer.from('7979004a32130b1c070d2e0cc705962478008c7ced0114370900cc080cb200c73e2b240cb200c73f1c0cb200b155190cb200b6fe130000000000000000000000000000000000000000000006ec900d0a', 'hex');
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
    if(true||Math.random()>0.6) {
      console.log('  - sending location [%s/%s]', ++ndatasent, ncommands);
      client.write(createRandomGPSCommand());
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



const createRandomGPSCommand = () => {
  let base32 = '7979004a32130b1c070d2e0cc705962478008c7ced0114370900cc080cb200c73e2b240cb200c73f1c0cb200b155190cb200b6fe130000000000000000000000000000000000000000000006ec900d0a';
  
  const padhex = (value, npos) => {return ("000000000000000" + value.toString(16)).substr(-npos)}  ;
    
  if (base32.substr(0,2*2)=='7878') {
    offset = 8;

    length = util.hex2int(base32.substr(2*2,1*2));
    cmd = base32.substr(3*2,1*2);
    infocontent = buf.substr(4*2, base32.length-11*2);
    serialNo = base32.substr(-6*2, 2*2);
  } else if(base32.substr(0,4)=='7979') {
    offset = 10;

    length = util.hex2int(base32.substr(3*2,1*2));
    cmd = base32.substr(4*2,1*2);
    infocontent = base32.substr(5*2, base32.length-11*2);
    serialNo = base32.substr(-6*2, 2*2);
  } else {
    // don't know!
    return '';
  }
  
  // console.log('example: %s', infocontent.substr(0*2,12));
  let now = new Date();
  let timevals = [
    now.getFullYear()-2000,
    now.getMonth()+1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ]
  let timestr = timevals.map((val)=>padhex(val,2)).join('');

  let command = base32;
  command = command.substr(0, offset) + timestr + command.substr(offset + 2*6); // substitute new date
   
  // gpstime   : util.toTime(infocontent.substr(0*2,2), infocontent.substr(1*2,2), infocontent.substr(2*2,2), infocontent.substr(3*2,2), infocontent.substr(4*2,2), infocontent.substr(5*2,2), 'hex'),
  // infolength: util.hex2int(infocontent.substr(6*2,1*2)),
  // unknown1 : infocontent.substr(7*2,1), // split byte @ 7x2 -> high nibble = ??? / low nibble = nsats for tracking
  // satellitecount : util.hex2int(infocontent.substr(7*2+1,1)),
  // latitude  : parseFloat(util.hex2int(infocontent.substr(8*2,4*2)) / 1800000),
  // longitude : parseFloat(util.hex2int(infocontent.substr(12*2,4*2)) / 1800000),
  // speed     : util.hex2int(infocontent.substr(16*2,1*2)),
  // coursestatus : infocontent.substr(17*2,2*2),
  // received  : new Date().toISOString(),
  
  function tohex(n, npos) {
      if (n < 0) {
          n = 0xFFFFFFFF + n + 1;
      }
      return ("00000000" + n.toString(16).toUpperCase()).substr(-npos);
  }
  
  let base = [52.090621, 5.121474] // put bike at a random location near utrecht
  latitude = base[0] + Math.random() / 100;
  longitude = base[1] + Math.random() / 100;
  
  // NB lat/long is encoded in 0..90 / 0..180 range with flags for north + south latitude / east + west longitude elsewhere
  // flags are not taken into account here for simplicity
  
  let latencoded = tohex(Math.round(1800000 * latitude), 8);
  let lngencoded = tohex(Math.round(1800000 * longitude), 8);

  let latdecoded = parseFloat(parseInt("0x"+latencoded, 16)/ 1800000);
  let lngdecoded = parseFloat(parseInt("0x"+lngencoded, 16)/ 1800000);
  // console.log("lat: %s %s %s", latitude, latencoded, latdecoded);
  // console.log("lng: %s %s %s", longitude, lngencoded, lngdecoded);
  
  // insert random coords in command
  // latitude  : parseFloat(util.hex2int(infocontent.substr(8*2,4*2)) / 1800000),
  // longitude : parseFloat(util.hex2int(infocontent.substr(12*2,4*2)) / 1800000),
  command = command.substr(0, offset + 8*2) + latencoded  + lngencoded +command.substr(offset + 16 * 2); // substitute new date
  
  return new Buffer.from(command, 'hex')
}

console.log(createRandomGPSCommand().toString('hex'));

console.log('Testing lock connection to %s:%s', server, port);
connect();
