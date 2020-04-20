const cluster = require('cluster');
const config = require('./config/config.json');

// Запуск приложения в несколько потоков
if (cluster.isMaster) {
	for (var i = 0; i < config.countOfThreads; i++) {
		cluster.fork();
	}
}

else {
	require('./router.js')
}