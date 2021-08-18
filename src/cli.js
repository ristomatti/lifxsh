#!/usr/bin/env node

'use strict';

const { isArray, isNumber, isString } = require('lodash');
const vorpal = new (require('vorpal'))();
const chalk = require('chalk');
const homeOrTmp = require('home-or-tmp');
const parse = require('parse-duration');
const lifxsh = require('./lib/lifxsh');
const mapper = require('./lib/mapper');
const yaml = require('js-yaml');
const fs = require('fs');

/**
 * Constants
 */
const STORAGE_PATH = homeOrTmp + '/.lifxsh'; // settings, command history
const PROMPT = chalk.magenta.bold('LIFX>'); // prompt
const DEFAULT_DURATION = 500;

let settings = {};
try {
  const settingsFile = `${STORAGE_PATH}/settings.yml`;
  settings = yaml.safeLoad(fs.readFileSync(settingsFile, 'utf8'));
} catch (e) {
  // ignored
}

// connect LIFX client
lifxsh.connect(settings.lights);

vorpal
  .command('list', 'List connected lights.')
  .action(async () => {
    await lifxsh.list();
  });

vorpal
  .command('on [names...]', 'Turn light(s) on.')
  .option('-d, --duration [value]', 'Transition time (50ms, 5s, "1h 15min" etc.)')
  .autocompletion(lightNameAutocompletion)
  .action(async (args) => {
    let opts = args.options;
    let names = getLightNames(args.names);
    let duration = parseDuration(opts);
    lifxsh.on(names, duration);
  });

vorpal
  .command('off [names...]', 'Turn light(s) off.')
  .option('-d, --duration [value]', 'Transition time (50ms, 5s, "1h 15min" etc.)')
  .autocompletion(lightNameAutocompletion)
  .action(async (args) => {
    let opts = args.options;
    let names = getLightNames(args.names);
    let duration = parseDuration(opts);
    lifxsh.off(names, duration);
  });

vorpal
  .command('color [names...]', 'Change color of light(s).')
  .option('-h, --hue [value]', 'Hue (0-360)')
  .option('-s, --saturation [value]', 'Saturation (0-100)')
  .option('-b, --brightness [value]', 'Brightness (0-100)')
  .option('-k, --kelvin [value]', 'Kelvin (2500-9500)')
  .option('-d, --duration [value]', 'Transition time (50ms, 5s, "1h 15min" etc.)')
  .autocompletion(lightNameAutocompletion)
  .action(async (args) => {
    let opts = args.options;
    let color = {
      hue: opts.hue,
      saturation: getSaturation(opts),
      brightness: opts.brightness,
      kelvin: opts.kelvin
    };
    let names = getLightNames(args.names);
    let duration = parseDuration(opts);
    lifxsh.color(names, color, duration);
  });

vorpal
  .command('ir [names...]', 'Set infrared settings.')
  .option('-b, --brightness [value]', 'Brightness (0-100)')
  .autocompletion(lightNameAutocompletion)
  .action(async (args) => {
    let opts = args.options;
    let names = getLightNames(args.names);
    lifxsh.maxIR(names, opts.brightness);
  });

vorpal
  .command('zone [name] [startZone] [endZone]', 'Change color of MultiZone light zones.')
  .option('-h, --hue [value]', 'Hue (0-360)')
  .option('-s, --saturation [value]', 'Saturation (0-100)')
  .option('-b, --brightness [value]', 'Brightness (0-100)')
  .option('-k, --kelvin [value]', 'Kelvin (2500-9000)')
  .option('-d, --duration [value]', 'Transition time (50ms, 5s, "1h 15min" etc.)')
  .option('-a, --apply', 'Apply immediately')
  .autocompletion(lightNameAutocompletion)
  .action(async (args) => {
    let opts = args.options;
    let zoneColor = {
      hue: opts.hue,
      saturation: getSaturation(opts),
      brightness: opts.brightness,
      kelvin: opts.kelvin
    };
    let duration = parseDuration(opts);
    lifxsh.colorZones(args.name, args.startZone, args.endZone, zoneColor, duration, opts.apply);
  });

vorpal
  .find('exit')
  .description('Exit lifxsh.')
  .action(() => {
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
  if (isNumber(opts.saturation)) {
    return opts.saturation;
  } else if (isNumber(opts.kelvin)) {
    return 0;
  } else if (isNumber(opts.hue)) {
    return 100;
  }
}

/**
 * Parse natural language to milliseconds.
 *
 * @param {{ duration: number | string }} opts
 */
function parseDuration(opts) {
  // @ts-ignore
  const duration = parse(opts.duration, 'ms');
  return duration !== null ? duration : DEFAULT_DURATION;
}

/**
 * Vorpal command light name autocompletion.
 */
function lightNameAutocompletion(text, iteration, cb) {
  let lastToken = text.split(' ').pop();
  let lightNames = mapper.getNames();
  let match = this.match(lastToken, lightNames);

  if (isArray(match)) {
    cb(void 0, match);
  } else if (isString(match)) {
    let input = this.parent.ui.input();
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
    // @ts-ignore
    .historyStoragePath(STORAGE_PATH)
    .history('')
    .show();
}
