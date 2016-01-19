'use strict';

const _ = require('lodash');
const vorpal = require('vorpal')();
const util = require('util');
const chalk = vorpal.chalk;
const cliff = require('cliff');
const mapper = require('./mapper');

let log = {
  found: function(light, state) {
    let event = chalk.bgBlue.white.bold(' NEW ');
    logEvent(event, light);
  },

  online: function(light, state) {
    let event = chalk.bgGreen.white.bold(' ONLINE ');
    logEvent(event, light);
  },

  offline: function(light, state) {
    let event = chalk.bgRed.white.bold(' OFFLINE ');
    logEvent(event, light);
  },

  table: function (detailsList) {
    let properties = ['label', 'status', 'brightness', 'id', 'ip'];
    let colors = ['bold', 'bold', 'bold', 'bold', 'bold'];
    let table = cliff.stringifyObjectRows(detailsList, properties, colors);
    vorpal.log(table);
  },

  info: function(msg) {
    vorpal.log(chalk.green('INFO: ') + msg);
  },

  warn: function(msg) {
    vorpal.log(chalk.yellow('WARNING: ') + msg);
  },

  error: function(msg) {
    vorpal.log(chalk.red('ERROR: ') + msg);
  },

  debug: function(object) {
    vorpal.log(chalk.cyan(util.inspect(object)));
  }
};

function logEvent(event, light) {
  let msg = util.format('%s %s', event, getLightInfo(light));
  timestamp(msg);
}

function timestamp(msg) {
  vorpal.log(util.format('%s %s', getTime(), msg));
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
