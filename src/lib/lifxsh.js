'use strict';

const _ = require('lodash');
const { isEmpty } = require('lodash');
const lifx = require('lifx-lan-client');
const mapper = require('./mapper');
const log = require('./log');

// default change duration
const DEFAULT_DURATION = 500;

const client = new lifx.Client();

const cache = {
  state: {}
};

const lifxsh = {
  /**
   * Initialize connection to lights.
   */
  connect: function (lights = []) {
    initEventListeners();
    const stopAfterDiscovery = !isEmpty(lights);
    const clientOptions = { lights, stopAfterDiscovery };
    client.init(clientOptions);
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
      }).catch(reason => {
        log.error(reason);
      });
    });

    Promise.all(statePromises).then(() => {
      log.table(lights);
    }).catch((reason) => {
      log.error(reason);
    });
  },

  /**
   * Turn light(s) on.
   *
   * @param {Array} names - Light names
   * @param {number} duration - Duration (ms)
   */
  on: function (names, duration = DEFAULT_DURATION) {
    let lights = findLights(names);
    lights.forEach(light => {
      light.on(duration);
    });
  },

  /**
   * Turn light(s) off.
   *
   * @param {Array} names - Light names
   * @param {number} duration - Duration (ms)
   */
  off: function (names, duration = DEFAULT_DURATION) {
    let lights = findLights(names);
    lights.forEach(light => {
      light.off(duration);
    });
  },

  /**
   * Change color of light(s).
   *
   * @param {Array} names - Light names
   * @param {Object} color - Color parameters
   * @param {number} duration - Duration (ms)
   */
  color: function (names, color, duration = DEFAULT_DURATION) {
    let lights = findLights(names);
    lights.forEach(light => {
      getState(light)
        .then(state => {
          _.defaults(color, state.color); // merge params with current state
          changeColor(light, color, duration);
          state.color = color;
          cache.state[light.id] = state;
        })
        .catch(reason => {
          log.error(reason, names, color, duration);
        });
    });
  },

  /**
   * Change color of MultiZone light zones.
   *
   * @param {string} name - Light name
   * @param {number} startZone - Start zone (first zone is 0)
   * @param {number} endZone - End zone
   * @param {Object} color - Color parameters
   * @param {number} duration - Duration (ms)
   * @param {boolean} apply - Apply changes immediately, defaults to false
   */
  colorZones: function (name, startZone, endZone, color, duration = DEFAULT_DURATION,
    apply = false) {
    let id = mapper.get(name);
    if (_.isUndefined(name)) {
      return;
    }
    let light = client.light(id);
    light.colorZones(
      startZone,
      endZone,
      color.hue,
      color.saturation,
      color.brightness,
      color.kelvin,
      duration,
      apply
    );
  },

  /**
   * Set maximum infrared brightness of light(s) off.
   *
   * @param {Array} names - Light names
   * @param {number} brightness - IR LED brightness percentage
   */
  maxIR: function (names, brightness) {
    let lights = findLights(names);
    lights.forEach(light => {
      light.maxIR(brightness);
    });
  },
};

/**
 * Find lights by name.
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
 * @param {Object} light - Light object from lifx-lan-client
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
          reject(reason);
        });
    }
  });
}

/**
 * Update, cache and return light state.
 *
 * @param {Object} light - Light from lifx-lan-client
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
 * @param {Object} light - Light from lifx-lan-client
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
 * Initialize listeners for events emitted by lifx-lan-client.
 */
function initEventListeners() {
   // @ts-ignore
   client.on('error', err => {
    log.error(err.stack);
    client.destroy();
  });

  // @ts-ignore
  client.on('light-new', light => {
    light.getLabel(() => {
      mapper.add(light.id, light.label);
    });
    updateState(light)
      .then(state => {
        log.found(light, state);
      })
      .catch(reason => {
        log.error(reason);
      });
  });

  // @ts-ignore
  client.on('light-online', light => {
    updateState(light)
      .then(state => {
        log.online(light, state);
      }).catch(reason => {
        log.error(reason);
      });
  });

  // @ts-ignore
  client.on('light-offline', light => {
    log.offline(light);
  });

  // @ts-ignore
  client.on('discovery-completed', () => {
    log.discoveryCompleted();
  });
}

// Expose lifxsh
module.exports = exports = lifxsh;
