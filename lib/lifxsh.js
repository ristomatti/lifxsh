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
lifxsh.connect = function() {
  initEventListeners();
  client.init();
};

/**
 * Disconnect from lights.
 */
lifxsh.disconnect = function() {
  client.destroy();
};

/**
 * List connected lights.
 */
lifxsh.list = function() {
  let lights = client.lights();
  _.each(lights, light => {
    log.info('ID: ' + light.id + ', label: ' + light.label);
  });
};

/**
 * Turn light on.
 *
 * @param {String} name - Light name.
 * @param {Number} duration - Duration (ms).
 */
lifxsh.on = function(name, duration) {
  let lights = getLights(name);
  _.each(lights, light => {
    light.on(duration);
  });
};

/**
 * Turn light off.
 *
 * @param {String} name - Light name.
 * @param {Number} duration - Duration (ms).
 */
lifxsh.off = function(name, duration) {
  let lights = getLights(name);
  _.each(lights, light => {
    light.off(duration);
  });
};

/**
 * Change light color.
 *
 * @param {String} name - Light name
 * @param {Object} color - Color object
 * @param {Number} duration - Duration (ms)
 */
lifxsh.color = function(name, color, duration) {
  let lights = getLights(name);
  _.each(lights, light => {
    light.getState((err, state) => {
      if (_.isUndefined(color.hue)) {
        color.hue = state.color.hue;
      }
      if (_.isUndefined(color.saturation)) {
        color.saturation = state.color.saturation;
      }
      if (_.isUndefined(color.brightness)) {
        color.brightness = state.color.brightness;
      }
      if (_.isUndefined(color.kelvin)) {
        color.kelvin = state.color.kelvin;
      }

      light.color(
        color.hue,
        color.saturation,
        color.brightness,
        color.kelvin,
        duration
      );
    });
  });
};

function getLights(name) {
  let lights = [];

  if ('all' === name) {
    lights = client.lights();
  }
  else {
    let id = mapper.get(name);
    if (id) {
      lights.push(client.light(id));
    }
  }

  return lights;
}

/**
 * Initialize listeners for events emitted by node-lifx client.
 */
function initEventListeners() {
  client.on('error', err => {
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
