#!/usr/bin/env node

'use strict';

const vorpal = require('vorpal')();
const lifxsh = require('./lib/lifxsh');
const mapper = require('./lib/mapper');

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
  .autocompletion(function(text, iteration, cb) {
    let lightNames = mapper.getNames();
    if (iteration > 1) {
      cb(void 0, lightNames);
    } else {
      let match = this.match(text, lightNames);
      if (match) {
        cb(void 0, lightNames);
      } else {
        cb(void 0, void 0);
      }
    }
  })
  .option('-h, --hue [value]', 'Hue (0-360)')
  .option('-s, --saturation [value]', 'Saturation (0-100)')
  .option('-b, --brightness [value]', 'Brightness (0-100)')
  .option('-k, --kelvin [value]', 'Kelvin (2500-9500)')
  .option('-d, --duration [ms]', 'Duration (ms)')
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

vorpal
  .delimiter('lifx> ')
  .show();

lifxsh.connect();
