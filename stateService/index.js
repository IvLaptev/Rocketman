const cluster = require('cluster');
const config = require('./config.json');


if (cluster.isMaster) {
	for (var i = 0; i < config.countOfThreads; i++) {
		cluster.fork();	// Запуск копий прилодений
	}
}

else {
	require('./stateService.js');
}