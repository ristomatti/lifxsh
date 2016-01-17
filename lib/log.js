'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const vorpal = require('vorpal')();
const util = require('util');
const mapper = require('./mapper');

let log = {
  found: function(light, state) {
    let event = chalk.bgBlue.white.bold(' NEW ');
    stamp(event, getLightInfo(light));
  },

  online: function(light, state) {
    let event = chalk.bgGreen.white.bold(' ONLINE ');
    stamp(event, getLightInfo(light));
  },

  offline: function(light, state) {
    let event = chalk.bgRed.white.bold(' OFFLINE ');
    stamp(event, getLightInfo(light));
  },

  info: function(msg) {
    vorpal.log(chalk.green('INFO:') + msg);
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

function getLightInfo(light) {
  return light.label + ' (IP: ' + light.address + ')';
}

function stamp(event, message) {
  let logStamp = util.format('%s %s %s', getTime(), event, message);
  vorpal.log(logStamp);
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
