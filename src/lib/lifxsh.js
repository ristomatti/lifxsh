'use strict';

const _      = require('lodash');
const lifx   = require('node-lifx');
const mapper = require('./mapper');
const log    = require('./log');

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
  connect: function () {
    initEventListeners();
    client.init();
  },

  /**
   * Disconnect from lights.
   */
  disconnect: function () {
    client.destroy();
  },

  /**
   * List connected lights.
   */
  list: function () {
    let lights = [];
    let statePromises = [];
    let onlineOffline = _.concat(client.lights('on'), client.lights('off'));

    onlineOffline.forEach(light => {
      let statePromise = getState(light);
      statePromises.push(getState(light));
      statePromise.then(state => {
        let lightProperties = {};
        lightProperties.Label = light.label;
        lightProperties.Power = state.power === 1 ? 'on' : 'off';
        lightProperties.Hue = state.color.hue + '';
        lightProperties.Saturation = state.color.saturation + '%';
        lightProperties.Brightness = state.color.brightness + '%';
        lightProperties.Temperature = state.color.kelvin + 'K';
        lightProperties.ID = light.id;
        lightProperties.IP = light.address;
        lights.push(lightProperties);
      })
    });

    Promise.all(statePromises).then(() => {
      log.table(lights);
    });
  },

  /**
   * Turn light(s) on.
   *
   * @param {Array} names - Light names
   * @param {number} duration - Duration (ms).
   */
  on: function (names, duration) {
    let lights = findLights(names);
    lights.forEach(light => {
      light.on(duration || DEFAULT_DURATION);
    });
  },

  /**
   * Turn light(s) off.
   *
   * @param {Array} names - Light names
   * @param {number} duration - Duration (ms).
   */
  off: function (names, duration) {
    let lights = findLights(names);
    lights.forEach(light => {
      light.off(duration || DEFAULT_DURATION);
    });
  },

  /**
   * Change color of light(s).
   *
   * @param {Array} names - Light names
   * @param {Object} color - Color parameters
   * @param {number} duration - Duration (ms)
   */
  color: function (names, color, duration) {
    let lights = findLights(names);
    lights.forEach(light => {
      getState(light)
        .then(state => {
          _.defaults(color, state.color); // merge params with current state
          changeColor(light, color, duration || DEFAULT_DURATION);
          state.color = color;
          cache.state[light.id] = state;
        })
        .catch(reason => {
          log.error(reason);
        });
    });
  }
}

/**
 * Find light or lights using one or more names.
 *
 * @param {Array} names - Light names
 * @return {Array} - Array of lights
 * @throws {TypeError}
 */
function findLights(names) {
  if (!_.isArray(names)) {
    throw new TypeError('Array of light names expected');
  }

  let lights = [];
  for (let name of names) {
    if ('all' === name) {
      return client.lights();
    } else {
      let id = mapper.get(name);
      if (id) {
        lights.push(client.light(id));
      }
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
    } else {
      updateState(light)
        .then(state => {
          resolve(state);
        })
        .catch(reason => {
          reject(Error(reason));
        });
    }
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
    updateState(light)
      .then(state => {
        log.found(light, state);
      })
      .catch(reason => {
        reject(Error(reason));
      });
  });

  client.on('light-online', light => {
    updateState(light)
      .then(state => {
        log.online(light, state);
      }).catch(reason => {
        reject(Error(reason));
      });
  });

  client.on('light-offline', light => {
    log.offline(light);
  });
}

// Expose lifxsh
module.exports = exports = lifxsh;
