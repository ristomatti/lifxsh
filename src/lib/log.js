import Vorpal from 'vorpal';
import { inspect, format } from 'node:util';
import chalk from 'chalk';
import cliff from 'cliff';
import { sortBy } from 'lodash-es';

const { bgBlue, bgMagenta, bgGreen, bgRed, green, yellow, red, cyan } = chalk;
const vorpal = new Vorpal();

export const log = {
  found: function(light, state) {
    let event = bgBlue.white.bold(' NEW ');
    logEvent(event, light);
  },

  discoveryCompleted: function() {
    let event = bgMagenta.white.bold(' DISCOVERY COMPLETED ');
    let msg = `${event} All lights found`;
    timestamp(msg);
  },

  online: function(light, state) {
    let event = bgGreen.white.bold(' ONLINE ');
    logEvent(event, light);
  },

  offline: function(light) {
    let event = bgRed.white.bold(' OFFLINE ');
    logEvent(event, light);
  },

  table: function(/** @type any[]*/ lights) {
    let rows = sortBy(lights, 'Label');
    let keys = [
      'Label',
      'Alias',
      'Power',
      'Hue',
      'Sat.',
      'Bri.',
      'Temp.',
      'ID',
      'IP'
    ];
    let colors = ['bold', 'bold', 'bold', 'bold', 'bold', 'bold'];
    let msg = cliff.stringifyObjectRows(rows, keys, colors);
    vorpal.log(msg);
  },

  info: function(msg) {
    timestamp(green('INFO: ') + msg);
  },

  warn: function(msg) {
    timestamp(yellow('WARNING: ') + msg);
  },

  error: function(msg, ...args) {
    timestamp(red('ERROR: ') + msg, ...args);
  },

  debug: function(object) {
    timestamp(cyan(inspect(object)));
  }
};

function logEvent(event, light) {
  let msg = format('%s %s', event, getLightInfo(light));
  timestamp(msg);
}

function timestamp(msg, ...args) {
  vorpal.log(format('%s %s', getTime(), msg), ...args);
}

function getLightInfo(light) {
  return light.label + ' (IP: ' + light.address + ')';
}

function getTime() {
  let now = new Date();
  let hour = now.getHours().toString();
  let minute = now.getMinutes().toString();

  if (hour.length === 1) { hour = '0' + hour; }
  if (minute.length === 1) { minute = '0' + minute; }

  return hour + ':' + minute;
}
