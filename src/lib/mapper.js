import { includes, keys } from 'lodash-es';
import { log } from './log.js';

/**
 * @type import('lodash').Dictionary<string>
 */
const nameToId = {};

export const mapper = {
  /**
   * Add light name to identifier mapping.
   *
   * @param {string} id - Light identifier
   * @param {string} name - Light name
   */
  add: function addName(id, name) {
    if (!id || !name) {
      log.error('Could not add light mapping. ID or name not defined!');
      return;
    }

    let key = this.getKey(name);
    nameToId[key] = id;
  },

  /**
   * Get light identifier by name.
   *
   * @param {string} name - Light name
   * @return {string|undefined} - Light identifier or undefined
   */
  get: function getId(name) {
    if (!name) {
      log.error('Could not find light mapping. No name defined!');
      return;
    }

    // value found from nameToId should already be an identifier
    if (includes(nameToId, name)) {
      return name;
    }

    let id = nameToId[this.getKey(name)];
    if (id) {
      return id;
    }

    log.warn('No light found with name "' + name + '"');
  },

  /**
   * Get list of light names and groups.
   */
  getNames: function() {
    let names = keys(nameToId).sort();
    names.push('all');
    return names;
  },

  /**
   * Get light mapping key.
   *
   * @param {string} name - Light name
   * @return {string} - Light mapping key
   */
  getKey: function(name) {
    return name ? name.toLowerCase().replace(/ /g, '-') : null;
  }
};
