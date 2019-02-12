global.info = console.info;

global.log = function() {
    info(('[ykit] ').gray + Array.prototype.join.call(arguments, ' '));
};
global.logError = function() {
    info(('[error] ').red + Array.prototype.join.call(arguments, ' '));
};
global.logWarn = function() {
    info(('[warn] ').yellow + Array.prototype.join.call(arguments, ' '));
};
global.logInfo = function() {
    info(('[info] ').blue + Array.prototype.join.call(arguments, ' '));
};
global.logDoc = function() {
    info(('[doc] ').blue + 'Visit ' + Array.prototype.join.call(arguments, ' ').underline + ' for doc.');
};

global.spinner = require('./utils/ora')();