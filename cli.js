#!/usr/bin/env node

'use strict';

const vorpal = require('vorpal')();
const homeOrTmp = require('home-or-tmp');
const lifxsh = require('./lib/lifxsh');
const mapper = require('./lib/mapper');
const chalk = vorpal.chalk;

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
  .command('on <names...>', 'Turn light(s) on.')
  .option('-d, --duration [ms]', 'Duration (ms)')
  .autocompletion(lightNameAutocompletion)
  .action((args, cb) => {
    let opts = args.options;
    lifxsh.on(args.names, opts.duration);
    cb();
  });

vorpal
  .command('off <names...>', 'Turn light(s) off.')
  .option('-d, --duration [ms]', 'Duration (ms)')
  .autocompletion(lightNameAutocompletion)
  .action((args, cb) => {
    let opts = args.options;
    lifxsh.off(args.names, opts.duration);
    cb();
  });

vorpal
  .command('color <names...>', 'Change color of light(s).')
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
      saturation: opts.saturation,
      brightness: opts.brightness,
      kelvin: opts.kelvin
    };
    lifxsh.color(args.names, color, opts.duration);
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
}
else {
  // display Vorpal prompt, initialize command history
  vorpal
    .delimiter(PROMPT)
    .historyStoragePath(STORAGE_PATH)
    .history('')
    .show();
}
