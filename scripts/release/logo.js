'use strict';

const chalk = require('chalk');

const LOGO = chalk
  .hex('#61dafb')
  .bold(
    `
                              __   
_______   ____ _____    _____/  |_ 
\\_  __ \\_/ __ \\\\__  \\ _/ ___\\   __\\
 |  | \\/\\  ___/ / __ \\\\  \\___|  |  
 |__|    \\___  >____  /\\___  >__|  
             \\/     \\/     \\/      
`
  )
  .replace(/(^\n+|\n+$)/g, '');

module.exports = LOGO;
