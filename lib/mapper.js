'use strict';

const _ = require('lodash');
const log = require('./log');

let mapper = module.exports;
let lightMap = {};

/**
 * Add light name to identifier mapping.
 *
 * @param {String} id - Light identifier
 * @param {String} name - Light name mapping
 */
mapper.add = function addName(id, name) {
  if (!id || !name) {
    log.error('Could not add light mapping. ID or name not defined!');
    return;
  }

  let key = getKey(name);
  lightMap[key] = id;
};

/**
 * Get light identifier by name.
 *
 * @param {String} name - Light name
 * @returns {String|undefined} - Light identifier or undefined
 */
mapper.get = function getId(name) {
  if (!name) {
    log.error('Could not find light mapping. No name defined!');
    return;
  }

  // value found from lightMap should be an identifier
  if (_.includes(lightMap, name)) {
    return name;
  }

  let id = lightMap[getKey(name)];
  if (id) {
    return id;
  }

  log.error('No light found with name "%s".', name);
};

mapper.getNames = function() {
  return _.keys(lightMap);
};

function getKey(name) {
  return name.toLowerCase();
}
