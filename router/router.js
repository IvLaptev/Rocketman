const express = require('express');
const config = require('./config/config.json');
const methods = require('./routerFunctions.js');

var staticPaths = config.pages;

const router = express(); 

router.get('/', function(request, response) {
	response.sendFile(__dirname + staticPaths['/']);
});

router.get('/main.js', function(request, response) {
	response.sendFile(__dirname + staticPaths['/main.js']);
});

router.get('/favicon.ico', function(request, response) {
	response.sendFile(__dirname + staticPaths['/favicon.ico']);
});

router.get('/light_logo', function(request, response) {
	response.sendFile(__dirname + staticPaths['/light_logo']);
});

router.get('/dark_logo', function(request, response) {
	response.sendFile(__dirname + staticPaths['/dark_logo']);
});

router.get('/style.css', function(request, response) {
	response.setHeader('Content-Type', 'text/css');
	response.sendFile(__dirname + staticPaths['/style.css']);
});

router.use(express.json(), function(request, response, next) {
	if (staticPaths[request.url] === undefined) {
		if (request.url === '/refresh') {
			// Обновление адресов taskService и stateService
			methods.refreshHosts();
		}
		response.redirect(301, '/');	// Перенаправление недействительных URL
	}

	else if (request.headers['content-type'].indexOf('application/json') != -1) {
		let method = methods[request.body.method];

		var body = {
			jsonrpc: '2.0',
			id: request.body.id
		}

		if (method != undefined) {
			body.result = method(request.body.params);
		}

		else {
			body.error = { code: -32601, message: 'Method not found'};
		}
		response.send(body);

		next();
	}
})

router.listen(config.port, function() {
	console.log(`Server is running (port: ${config.port})`);

	methods.refreshHosts();
});