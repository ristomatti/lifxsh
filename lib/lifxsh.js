'use strict';

const _ = require('lodash');
const lifx = require('node-lifx');
const log = require('./log');
const mapper = require('./mapper');

// default change duration
const DEFAULT_DURATION = 500;

let client = new lifx.Client();

let cache = {
  state: {}
};

let lifxsh = {
  /**
   * Initialize connection to lights.
   */
  connect: function() {
    initEventListeners();
    client.init();
  },

  /**
   * Disconnect from lights.
   */
  disconnect: function() {
    client.destroy();
  },

  /**
   * List connected lights.
   */
  list: function() {
    let lights = client.lights();
    lights.forEach(light => {
      log.info('ID: ' + light.id + ', label: ' + light.label);
    });
  },

  /**
   * Turn light on.
   *
   * @param {string} name - Light name.
   * @param {number} duration - Duration (ms).
   */
  on: function(name, duration) {
    let lights = findLights(name);
    lights.forEach(light => {
      light.on(duration || DEFAULT_DURATION);
    });
  },

  /**
   * Turn light off.
   *
   * @param {string} name - Light name.
   * @param {number} duration - Duration (ms).
   */
  off: function(name, duration) {
    let lights = findLights(name);
    lights.forEach(light => {
      light.off(duration || DEFAULT_DURATION);
    });
  },

  /**
   * Change light color.
   *
   * @param {string} name - Light name
   * @param {Object} color - Color parameters
   * @param {number} duration - Duration (ms)
   */
  color: function(name, color, duration) {
    let lights = findLights(name);
    lights.forEach(light => {
      getState(light)
        .then(state => {
          _.defaults(color, state.color) // merge params with current state
          changeColor(light, color, duration || DEFAULT_DURATION);
        })
        .catch(reason => {
          log.error(reason);
        });
    });
  }
}

/**
 * Find light or lights by name.
 *
 * @param {string} name - Light name
 * @return {Array} - Array of lights
 */
function findLights(name) {
  let lights = [];
  if ('all' === name) {
    lights = client.lights();
  } else {
    let id = mapper.get(name);
    if (id) {
      lights.push(client.light(id));
    }
  }
  return lights;
}

/**
 * Get light state. Returns cached value or state from light if no cached value
 * is found.
 *
 * @param {Object} light - Light object from node-lifx client
 * @return {Promise} - Promise of light state
 */
function getState(light) {
  let cachedState = cache.state[light.id];
  return new Promise((resolve, reject) => {
    if (cachedState) {
      resolve(cachedState);
    }
    updateState(light)
      .then(state => {
        resolve(state);
      })
      .catch(reason => {
        reject(Error(reason));
      });
  });
}

/**
 * Update, cache and return light state.
 *
 * @param {Object} light - Light from node-lifx client
 * @return {Promise} - Promise of light state
 */
function updateState(light) {
  return new Promise((resolve, reject) => {
    light.getState((err, state) => {
      if (err) {
        reject(err);
      }
      cache.state[light.id] = state;
      resolve(state);
    });
  });
}

/**
 * Change light color.
 *
 * @param {Object} light - Light from node-lifx client
 * @param {Object} color - Color parameters
 * @param {number} duration - Change duration (ms)
 */
function changeColor(light, color, duration) {
  light.color(
    color.hue,
    color.saturation,
    color.brightness,
    color.kelvin,
    duration
  );
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
    updateState(light);
  });

  client.on('light-online', light => {
    updateState(light);
    log.info('Light back online. ID: ' + light.id + ', IP: ' + light.address);
  });

  client.on('light-offline', light => {
    updateState(light);
    log.warn('Light offline. ID: ' + light.id + ', IP: ' + light.address);
  });
}

// Expose lifxsh
module.exports = exports = lifxsh;
