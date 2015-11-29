'use strict';

const vorpal = require('vorpal')();
const chalk = require('chalk');

function info(msg) {
  vorpal.log(chalk['green']('INFO: ') + msg);
}

function warn(msg) {
  vorpal.log(chalk['yellow']('WARN: ') + msg);
  refresh();
}

function error(msg) {
  vorpal.log(chalk['red']('ERROR: ') + msg);
  refresh();
}

function refresh() {
  vorpal.ui.refresh();
}

module.exports = {
  info: info,
  warn: warn,
  error: error
}
