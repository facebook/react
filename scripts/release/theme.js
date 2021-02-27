'use strict';

const chalk = require('chalk');

const colors = {
  blue: '#0091ea',
  gray: '#78909c',
  green: '#00c853',
  red: '#d50000',
  yellow: '#ffd600',
};

const theme = chalk.constructor();
theme.package = theme.hex(colors.green);
theme.version = theme.hex(colors.yellow);
theme.tag = theme.hex(colors.yellow);
theme.build = theme.hex(colors.yellow);
theme.commit = theme.hex(colors.yellow);
theme.error = theme.hex(colors.red).bold;
theme.dimmed = theme.hex(colors.gray);
theme.caution = theme.hex(colors.red).bold;
theme.link = theme.hex(colors.blue).underline.italic;
theme.header = theme.hex(colors.green).bold;
theme.path = theme.hex(colors.gray).italic;
theme.command = theme.hex(colors.gray);
theme.quote = theme.italic;

theme.diffHeader = theme.hex(colors.gray);
theme.diffAdded = theme.hex(colors.green);
theme.diffRemoved = theme.hex(colors.red);

theme.spinnerInProgress = theme.hex(colors.yellow);
theme.spinnerError = theme.hex(colors.red);
theme.spinnerSuccess = theme.hex(colors.green);

module.exports = theme;
