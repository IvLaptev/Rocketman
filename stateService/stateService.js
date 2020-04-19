const express = require('express');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const config = require('./config.json');
const methods = require('./serviceFunctions');
const sessionStorage = require('./sessionStorage');

const service = express();

service.use(express.json());

service.use(cors({
	origin: "http://" + config.router,
	exposedHeaders: "Set-Cookie, *",
	credentials: true
}));

service.use(session({
	store: sessionStorage,
	secret: config.sessionSecret,
	saveUninitialized: true,
	resave: false,
	cookie: { maxAge: 3600000}
}));

var validHosts = [];	// Сервера, используемые в системе (безопасные)

service.use(function(request, response) {
	if (request.headers['content-type'].indexOf('application/json') != -1) {
		let method = methods[request.body.method];

		var body = {
			jsonrpc: '2.0',
			id: request.body.id
		}

		if (request.body.method === 'isAuthorized') {
			body.result = { authorized: request.session.authorized };
			console.log(body);
			response.send(body);
		}

		else if (method != undefined) {
			console.log(request.hostname);
			var allowed;
			
			if (request.session.authorized === true) {
				allowed = true;
			}

			else if (validHosts.indexOf(request.hostname) != -1) {
				allowed = true
			}

			else if (methods.validateHost(request.hostname)) {
				allowed = true;
				validHosts.push(request.hostname);
			}

			else allowed = false;
			
			if (allowed) {
				method(request.body.params).then(result => {
					body.result = result;
					console.log(result);
					response.send(body);
				});
			}
			else {
				body.error = { code: -1, message: 'Not authorized'};
				console.error(body);
				response.send(body);				
			}
		}


		else {
			body.error = { code: -32601, message: 'Method not found'};
			console.error(body);
			response.send(body);
		}
	}

	else {
		response.send(); 
	}
})

service.listen(config.port, function() {
	console.log(`Server is running (port: ${config.port})`);
});