#!/usr/bin/env node

'use strict';

const vorpal = require('vorpal')();
const homeOrTmp = require('home-or-tmp');
const lifxsh = require('./lib/lifxsh');
const mapper = require('./lib/mapper');

// storage path for command history and settings
const STORAGE_PATH = homeOrTmp + '/.lifxsh';

// connect LIFX client
lifxsh.connect();

vorpal
  .command('list', 'List connected lights.')
  .action((args, cb) => {
    lifxsh.list();
    cb();
  });

vorpal
  .command('on <name>', 'Turn light on.')
  .option('-d, --duration [ms]', 'Duration (ms)')
  .action((args, cb) => {
    let opts = args.options;
    lifxsh.on(args.name, opts.duration);
    cb();
  });

vorpal
  .command('off <name>', 'Turn light off.')
  .option('-d, --duration [ms]', 'Duration (ms)')
  .action((args, cb) => {
    let opts = args.options;
    lifxsh.off(args.name, opts.duration);
    cb();
  });

vorpal
  .command('color <name>', 'Change light color.')
  .option('-h, --hue [value]', 'Hue (0-360)')
  .option('-s, --saturation [value]', 'Saturation (0-100)')
  .option('-b, --brightness [value]', 'Brightness (0-100)')
  .option('-k, --kelvin [value]', 'Kelvin (2500-9500)')
  .option('-d, --duration [ms]', 'Duration (ms)')
  .autocompletion(function(text, iteration, cb) {
    // TODO: move to a separate function to be used in all commands
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
  })
  .action((args, cb) => {
    let opts = args.options;
    let color = {
      hue: opts.hue,
      saturation: opts.saturation,
      brightness: opts.brightness,
      kelvin: opts.kelvin
    };
    lifxsh.color(args.name, color, opts.duration);
    cb();
  });

vorpal
  .find('exit')
  .description('Exits lifxsh.')
  .action((args, cb) => {
    lifxsh.disconnect();
    process.exit(0);
  });

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
    .delimiter('lifx> ')
    .historyStoragePath(STORAGE_PATH)
    .history('')
    .show();
}
