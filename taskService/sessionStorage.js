const session = require('express-session');
const redisStorage = require('connect-redis')(session);
const redis = require('redis');
const config = require('./config.json');

const client = redis.createClient();
client.on('error', (err) => {
	console.log('Redis error: ', err);
});

module.exports = new redisStorage({
	host: config.redisHost,
	port: config.redisPort,
	client: client,
	ttl: 3600000
})