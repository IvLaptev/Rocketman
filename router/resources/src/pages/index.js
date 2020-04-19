var main = require('./main-page');
var login = require('./login-page');
var signup = require('./signup-page');
var task = require('./new-task');
var error = require('./error-page');

module.exports.pages = {
    'login-page': login.component,
    'signup-page': signup.component,
    'main-page': main.component,
    'new-task': task.component,
    'error-page': error.component
};

module.exports.setTaskConnection = function(controller) {
    login.setConnection(controller);
    signup.setConnection(controller);
    main.setTaskConnection(controller);
    task.setTaskConnection(controller);
};

module.exports.setStateConnection = function(controller) {
    main.setStateConnection(controller);
    task.setStateConnection(controller);
};