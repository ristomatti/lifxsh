#!/usr/bin/env node

'use strict';

const vorpal = require('vorpal')();
const lifxsh = require('./lib/lifxsh');

vorpal
  .command('list', 'Lists connected lights.')
  .action((args, cb) => {
    lifxsh.list();
    cb();
  });

vorpal
  .command('on <name>')
  .description('Turns light on.')
  .action((args, cb) => {
    lifxsh.on(args.name);
    cb();
  });

vorpal
  .command('off <name>')
  .description('Turns light off.')
  .action((args, cb) => {
    lifxsh.off(args.name);
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
