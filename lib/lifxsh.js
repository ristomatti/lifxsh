'use strict';

const _ = require('lodash');
const lifx = require('node-lifx');
const log = require('./log');
const mapper = require('./mapper');

let lifxsh = module.exports;
let client = new lifx.Client();

/**
 * Initialize connection to lights.
 */
lifxsh.connect = function () {
  initEventListeners();
  client.init();
};

/**
 * Disconnect from lights.
 */
lifxsh.disconnect = function () {
  client.destroy();
};

/**
 * List connected lights.
 */
lifxsh.list = function () {
  let lights = client.lights();
  _.each(lights, light => {
    log.info('ID: ' + light.id + ', label: ' + light.label);
  });
};

/**
 * Turn light on.
 *
 * @param name - Light name.
 */
lifxsh.on = function (name) {
  let id = mapper.get(name);
  if (id) {
    client.light(id).on();
  }
};

/**
 * Turn light off.
 *
 * @param name - Light name.
 */
lifxsh.off = function (name) {
  let id = mapper.get(name);
  if (id) {
    client.light(id).off();
  }
};

/**
 * Initialize listeners for events emitted by node-lifx client.
 */
function initEventListeners() {
  client.on('error', function (err) {
    log.error(err.stack);
    client.destroy();
  });

  client.on('light-new', light => {
    light.getLabel(() => {
      mapper.add(light.id, light.label);
    });
  });

  client.on('light-online', light => {
    log.info('Light back online. ID: ' + light.id + ', IP: ' + light.address);
  });

  client.on('light-offline', light => {
    log.warn('Light offline. ID: ' + light.id + ', IP: ' + light.address);
  });
}
