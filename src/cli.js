#!/usr/bin/env node

'use strict';

const _         = require('lodash');
const vorpal    = require('vorpal')();
const chalk     = vorpal.chalk;
const homeOrTmp = require('home-or-tmp');
const lifxsh    = require('./lib/lifxsh');
const mapper    = require('./lib/mapper');

/**
 * Constants
 */
const STORAGE_PATH = homeOrTmp + '/.lifxsh'; // settings, command history
const PROMPT = chalk.magenta.bold('LIFX>'); // prompt

// connect LIFX client
lifxsh.connect();

vorpal
  .command('list', 'List connected lights.')
  .action((args, cb) => {
    lifxsh.list();
    cb();
  });

vorpal
  .command('on [names...]', 'Turn light(s) on.')
  .option('-d, --duration [ms]', 'Duration (ms)')
  .autocompletion(lightNameAutocompletion)
  .action((args, cb) => {
    let opts = args.options;
    let names = getLightNames(args.names);
    lifxsh.on(names, opts.duration);
    cb();
  });

vorpal
  .command('off [names...]', 'Turn light(s) off.')
  .option('-d, --duration [ms]', 'Duration (ms)')
  .autocompletion(lightNameAutocompletion)
  .action((args, cb) => {
    let opts = args.options;
    let names = getLightNames(args.names);
    lifxsh.off(names, opts.duration);
    cb();
  });

vorpal
  .command('color [names...]', 'Change color of light(s).')
  .option('-h, --hue [value]', 'Hue (0-360)')
  .option('-s, --saturation [value]', 'Saturation (0-100)')
  .option('-b, --brightness [value]', 'Brightness (0-100)')
  .option('-k, --kelvin [value]', 'Kelvin (2500-9500)')
  .option('-d, --duration [ms]', 'Duration (ms)')
  .autocompletion(lightNameAutocompletion)
  .action((args, cb) => {
    let opts = args.options;
    let color = {
      hue: opts.hue,
      saturation: getSaturation(opts),
      brightness: opts.brightness,
      kelvin: opts.kelvin
    };
    let names = getLightNames(args.names);
    lifxsh.color(names, color, opts.duration);
    cb();
  });

vorpal
  .command('ir [names...]', 'Set infrared settings.')
  .option('-b, --brightness [value]', 'Brightness (0-100)')
  .autocompletion(lightNameAutocompletion)
  .action((args, cb) => {
    let opts = args.options;
    let names = getLightNames(args.names);
    lifxsh.maxIR(names, opts.brightness);
    cb();
  });

vorpal
  .command('zone [name] [startZone] [endZone]', 'Change color of MultiZone light zones.')
  .option('-h, --hue [value]', 'Hue (0-360)')
  .option('-s, --saturation [value]', 'Saturation (0-100)')
  .option('-b, --brightness [value]', 'Brightness (0-100)')
  .option('-k, --kelvin [value]', 'Kelvin (2500-9000)')
  .option('-d, --duration [ms]', 'Duration (ms)')
  .option('-a, --apply', 'Apply immediately')
  .autocompletion(lightNameAutocompletion)
  .action((args, cb) => {
    let opts = args.options;
    let zoneColor = {
      hue: opts.hue,
      saturation: getSaturation(opts),
      brightness: opts.brightness,
      kelvin: opts.kelvin
    };
    lifxsh.colorZones(args.name, args.startZone, args.endZone, zoneColor, opts.duration, opts.apply);
    cb();
  });

vorpal
  .find('exit')
  .description('Exit lifxsh.')
  .action((args, cb) => {
    lifxsh.disconnect();
    process.exit(0);
  });

/**
 * Default to 'all' if no light name is provided.
 *
 * @param {any} lightNames
 * @returns
 */
function getLightNames(lightNames) {
  return lightNames ? lightNames : ['all'];
}

/**
 * If saturation is omitted, use 0% saturation when kelvin is defined, 100% if not.
 *
 * @param {any} opts
 * @returns Saturation value.
 */
function getSaturation(opts) {
  if (_.isNumber(opts.saturation)) {
    return opts.saturation;
  } else if (_.isNumber(opts.kelvin)) {
    return 0;
  } else if (_.isNumber(opts.hue)) {
    return 100;
  }
  return;
}

/**
 * Vorpal command light name autocompletion.
 */
function lightNameAutocompletion(text, iteration, cb) {
  let lastToken = text.split(' ').pop();
  let lightNames = mapper.getNames();
  let match = this.match(lastToken, lightNames);

  if (match) {
    var input = this.parent.ui.input();
    let endIndex = match.indexOf(lastToken) + lastToken.length;
    let remainder = match.substr(endIndex);
    cb(void 0, input + remainder);
  } else {
    cb(void 0, lightNames);
  }
}

// use cli arguments if found, otherwise use interactive mode
if (process.argv.length > 2) {
  // allow lifxsh connection to be initialised, parse arguments and exit
  setTimeout(() => {
    vorpal.parse(process.argv);
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }, 1000);
} else {
  // display Vorpal prompt, initialize command history
  vorpal
    .delimiter(PROMPT)
    .historyStoragePath(STORAGE_PATH)
    .history('')
    .show();
}
