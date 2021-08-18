'use strict';

const vorpal = new (require('vorpal'))();
const util = require('util');
const chalk = require('chalk');
const cliff = require('cliff');
const { sortBy } =require('lodash');

const log = {

  found: function(light, state) {
    let event = chalk.bgBlue.white.bold(' NEW ');
    logEvent(event, light);
  },

  discoveryCompleted: function() {
    let event = chalk.bgMagenta.white.bold(' DISCOVERY COMPLETED ');
    let msg = `${event} All lights found`;
    timestamp(msg);
  },

  online: function(light, state) {
    let event = chalk.bgGreen.white.bold(' ONLINE ');
    logEvent(event, light);
  },

  offline: function(light) {
    let event = chalk.bgRed.white.bold(' OFFLINE ');
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
    timestamp(chalk.green('INFO: ') + msg);
  },

  warn: function(msg) {
    timestamp(chalk.yellow('WARNING: ') + msg);
  },

  error: function(msg, ...args) {
    timestamp(chalk.red('ERROR: ') + msg, ...args);
  },

  debug: function(object) {
    timestamp(chalk.cyan(util.inspect(object)));
  }
};

function logEvent(event, light) {
  let msg = util.format('%s %s', event, getLightInfo(light));
  timestamp(msg);
}

function timestamp(msg, ...args) {
  vorpal.log(util.format('%s %s', getTime(), msg), ...args);
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

// expose log
module.exports = exports = log;
