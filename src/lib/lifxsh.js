'use strict';

const _ = require('lodash'),
  lifx = require('node-lifx'),
  util = require('util'),
  mapper = require('./mapper'),
  log = require('./log');

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
    getLightStates((light, state) => {
      return {
        Label: light.label,
        Power: state.power === 1 ? 'on' : 'off',
        Hue: state.color.hue,
        Saturation: state.color.saturation + '%',
        Brightness: state.color.brightness + '%',
        Temperature: state.color.kelvin + 'K',
        ID: light.id,
        IP: light.address
      };
    }).then(lights => {
      log.table(lights);
    });
  },

  /**
   * Monitor connected lights.
   */
  monitor: function () {
    getLightStates((light, state) => {
      return {
        label: state.label,
        power: state.power === 1 ? 'on' : 'off',
        hue: state.color.hue,
        saturation: state.color.saturation,
        brightness: state.color.brightness,
        kelvin: state.color.kelvin
      };
    }).then(lights => {
      log.monitor(lights);
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
    for (let light of lights) {
      light.on(duration || DEFAULT_DURATION);
    }
  },

  /**
   * Turn light(s) off.
   *
   * @param {Array} names - Light names
   * @param {number} duration - Duration (ms).
   */
  off: function (names, duration) {
    let lights = findLights(names);
    for (let light of lights) {
      light.off(duration || DEFAULT_DURATION);
    }
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
    for (let light of lights) {
      getState(light)
        .then(state => {
          _.defaults(color, state.color) // merge params with current state
          changeColor(light, color, duration || DEFAULT_DURATION);
          cache.state[light.id] = state;
        })
        .catch(reason => {
          log.error(reason);
        });
    }
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
    }
    updateState(light).then(state => {
      resolve(state);
    }).catch(reason => {
      reject(Error(reason));
    });
  });
}

function getLightStates(callback) {
  return new Promise((resolve, reject) => {
    let lights = [];
    let statePromises = [];
    // TODO: Create list from cache
    let onlineOffline = _.concat(client.lights('on'), client.lights('off'));

    for (let light of onlineOffline) {
      let statePromise = getState(light);
      statePromises.push(statePromise);
      statePromise.then(state => {
        let lightProperties = callback(light, state);
        lights.push(lightProperties);
      })
    }

    Promise.all(statePromises).then(() => {
      resolve(lights);
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
    updateState(light).then(state => {
      log.found(light, state);
    });
  });

  client.on('light-online', light => {
    updateState(light).then(state => {
      log.online(light, state);
    });
  });

  client.on('light-offline', light => {
    log.offline(light);
  });
}

// Expose lifxsh
module.exports = exports = lifxsh;
