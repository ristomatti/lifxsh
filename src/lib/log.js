'use strict';

const _ = require('lodash'),
  vorpal = require('vorpal')(),
  util = require('util'),
  cliff = require('cliff'),
  blessed = require('blessed'),
  contrib = require('blessed-contrib'),
  mapper = require('./mapper'),
  chalk = vorpal.chalk;

let log = {
  found: function (light, state) {
    let event = chalk.bgBlue.white.bold(' NEW ');
    logEvent(event, light);
  },

  online: function (light, state) {
    let event = chalk.bgGreen.white.bold(' ONLINE ');
    logEvent(event, light);
  },

  offline: function (light) {
    let event = chalk.bgRed.white.bold(' OFFLINE ');
    logEvent(event, light);
  },

  monitor: function (lights) {

    let dataX = [];
    let idx = 0;

    for (let light of lights) {
      if (idx > 3) {
        break;
      }
      let brightness = (light.brightness / 100).toFixed(2);
      dataX.push({
        percent: brightness,
        label: light.label,
        color: 'green'
      });
      idx++;
    }

    this.debug(dataX);

    let screen = blessed.screen();

    let donut = {
      label: 'Lamput',
      radius: 8,
      arcWidth: 3,
      spacing: 1,
      yPadding: 2,
      data: dataX
    };
    let donut2 = {
      label: 'Lamput2',
      radius: 8,
      arcWidth: 3,
      spacing: 1,
      yPadding: 2,
      data: dataX
    };

    var grid = new contrib.Grid({ rows: 12, cols: 12, screen: screen });
    grid.set(0, 0, 4, 4, contrib.donut, donut);
    grid.set(4, 4, 4, 4, contrib.donut2, donut2);

    screen.render();
  },

  table: function (lights) {
    if (lights.length === 0) {
      return;
    }
    let properties = _.keys(lights[0]);
    let colors = ['bold', 'bold', 'bold', 'bold', 'bold'];
    let msg = cliff.stringifyObjectRows(lights, properties, colors);
    vorpal.log(msg);
  },

  info: function (msg) {
    vorpal.log(chalk.green('INFO: ') + msg);
  },

  warn: function (msg) {
    vorpal.log(chalk.yellow('WARNING: ') + msg);
  },

  error: function (msg) {
    vorpal.log(chalk.red('ERROR: ') + msg);
  },

  debug: function (object) {
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

  if (hour.length === 1) {
    hour = '0' + hour;
  }
  if (minute.length === 1) {
    minute = '0' + minute;
  }

  return hour + ':' + minute;
}

// expose log
module.exports = exports = log;
