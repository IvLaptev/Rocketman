const express = require('express');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const config = require('./config.json');
const methods = require('./serviceFunctions');
const sessionStorage = require('./sessionStorage');

const service = express();

service.use(express.json());

// Настройка заголовков cross-origin запросов
service.use(cors({
	origin: "http://" + config.router,
	exposedHeaders: "Set-Cookie, *",
	credentials: true
}));

// Настройка хранения сессий
service.use(session({
	store: sessionStorage,
	secret: config.sessionSecret,
	saveUninitialized: true,
	resave: false,
	cookie: { maxAge: 3600000}
}));

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

		else if (method != undefined) {	// Проверка наличия запрашиваемого метода
			let nonAuthoryzed = request.body.method === 'logIn' || request.body.method === 'signUp';
			if (request.session.authorized === true || nonAuthoryzed) {
				request.body.params.userId = request.session.user;	// Добавление к телу запрося номера пользователя

				if (methods.checkParams[request.body.method](request.body.params)) {	// Проверка наличия необходимых параметров
					method(request.body.params).then(result => {	// Выполнение запрашиваемого метода
						if (request.body.method === 'logIn') {
							request.session.authorized = result.authorized;
							request.session.user = result.userId;
							result.userId = undefined;
						}
						body.result = result;
						console.log(result);
						response.send(body);
					});
				}
				else{
					body.error = { code: -32602, message: 'Invalid params'};
					console.error(body);
					response.send(body);				
				}
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
		response.send(); // TODO: Return to task list
	}
})

service.listen(config.port, function() {
	console.log(`Server is running (port: ${config.port})`);
	console.log(methods.a);
});