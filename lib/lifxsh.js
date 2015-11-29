'use strict';

const _ = require('lodash');
const lifx = require('node-lifx');
const log = require('./log');

let lifxClient = new lifx.Client();

function connect() {
  lifxClient.on('error', function(err) {
    log.error('Error:\n' + err.stack);
    lifxClient.destroy();
  });

  lifxClient.on('light-new', function(light) {
    log.info('New light found. ID: ' + light.id + ', IP: ' + light.address + ':' + light.port);
  });

  lifxClient.on('light-online', function(light) {
    log.info('Light back online. ID: ' + light.id + ', IP: ' + light.address + ':' + light.port);
  });

  lifxClient.on('light-offline', function(light) {
    log.warn('Light offline. ID: ' + light.id + ', IP: ' + light.address + ':' + light.port);
  });

  lifxClient.init();
}

function list() {
  _.each(lifxClient.lights(''), light => {
    log.info('ID: ' + light.id + ', label: ' + light.label);
  });
}

function disconnect() {
  lifxClient.destroy();
}

module.exports = {
  connect: connect,
  list: list,
  disconnect: disconnect
};
