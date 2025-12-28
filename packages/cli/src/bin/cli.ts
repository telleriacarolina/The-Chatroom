#!/usr/bin/env node

import { program } from 'commander';
import { createCommand } from './commands/create';
import { dbCommand } from './commands/db';
import { userCommand } from './commands/user';
import { devCommand } from './commands/dev';
import { deployCommand } from './commands/deploy';
import { analyticsCommand } from './commands/analytics';

const version = require('../../package.json').version;

program
  .name('chatroom')
  .description('The Chatroom CLI - Manage your chatroom application')
  .version(version);

// Commands
program.addCommand(createCommand);
program.addCommand(dbCommand);
program.addCommand(userCommand);
program.addCommand(devCommand);
program.addCommand(deployCommand);
program.addCommand(analyticsCommand);

// Global options
program
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--no-color', 'Disable colored output');

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
