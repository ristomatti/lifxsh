#!/usr/bin/env node

'use strict';

require('app-module-path').addPath(__dirname);

let LifxClient = require('node-lifx').Client;
let client = new LifxClient();

client.on('error', function(err) {
  console.error('Error:\n' + err.stack);
  client.destroy();
});

startMessageLogging();

client.on('light-new', function(light) {
  console.log('New light found. ID:' + light.id + ', IP:' + light.address + ':' + light.port);
});

client.on('light-online', function(light) {
  console.log('Light back olifxshnline. ID:' + light.id + ', IP:' + light.address + ':' + light.port);
});

client.on('light-offline', function(light) {
  console.log('Light offline. ID:' + light.id + ', IP:' + light.address + ':' + light.port);
});

client.on('listening', function() {
  let address = client.address();
  console.log('Started listening on %s:%d\n', address.address, address.port);
});

client.init({}, function() {
  client.lights().forEach(function(light) {
    console.log('------------------');
    console.log(light);
  });
});

//console.log(client.prototype.lights());

function startMessageLogging() {
  client.on('message', function (msg, rinfo) {
    if (typeof msg.type === 'string') {
      // Known packages send by the lights as broadcast
      switch (msg.type) {
        case 'echoResponse':
        case 'getOwner':
        case 'stateOwner':
        case 'getGroup':
        case 'getVersion':
        case 'stateGroup':
        case 'getLocation':
        case 'stateLocation':
        case 'stateTemperature':
        case 'statePower':
          //console.log(msg, ' from ' + rinfo.address);
          break;
        default:
          break;
      }
    } else {
      // Unknown message type
      console.warn(msg, ' from ' + rinfo.address);
    }
  });
}
