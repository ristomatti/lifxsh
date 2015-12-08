'use strict';

const _ = require('lodash');
const chalk = require('chalk');
const vorpal = require('vorpal')();
const util = require('util');

function formatMessage(args) {
  if (!args) {
    return;
  }

  if (args.length > 1) {
    return util.format.apply(this, _.toArray(args));
  }

  return args[0];
}

module.exports = {
  info: function() {
    vorpal.log(chalk.green('INFO: ') + formatMessage(arguments));
  },
  debug: function(msg) {
    vorpal.log(chalk.cyan('DEBUG: ') + formatMessage(arguments));
  },
  warn: function() {
    vorpal.log(chalk.yellow('WARN: ') + formatMessage(arguments));
  },
  error: function() {
    vorpal.log(chalk.red('ERROR: ') + formatMessage(arguments));
  }
};
