const mysql = require('mysql2');
const request = require('request-promise');
const config = require('./config.json');

// Подключение к базе данных
const database = mysql.createConnection({
	//connectionLimit: 5,
	host: config.dbHost,
	port: config.dbPort,
	database: config.dbName,
	user: config.dbUser,
	password: config.dbPass
}).promise();

/*
* Набор базовых функций сервиса, которые также представляют его API
* params - набор параметров, различный для каждой функции, целостность которого
*		   проверяется в checkParams
*/
const functions = {
	/*
	* Функция получения статусов заданий по их номерам
	*/
	getStates: async function(params) {
		var result;

		var conditions = `s.task_id IN (${params.taskIds.join(',')})`;

		await database.query(`SELECT states.task_id, states.state, states.change_date` +
							 ` FROM states` +
							 ` RIGHT JOIN (SELECT task_id, MAX(state_id) AS state_id FROM states GROUP BY task_id) s` +
							 ` ON states.state_id = s.state_id` +
							 ` WHERE ${conditions}` +
							 ` ORDER BY states.task_id DESC;`)
			.then(([data, fields]) => {
				result = data;
			})
			.catch(err => {
				console.log(err);
				result = null;
			});
		return {states: result};
	},
	// Функция изменения статуса задания
	updateState: async function(params) {
		var result;
		await database.query(`INSERT states(task_id, state, change_date)
							  VALUES(${params.taskId}, ${params.state}, '${params.date}');`)
			.then(data => {
				result = {status: 'OK'};
			})
			.catch(err => {
				console.log(err);
				result = {status: 'ERROR'};
			});
		return result;
	},
	// Проверить адрес запроса 
	validateHost: async function(params) {
		console.log('1');
		result = false;
		let reqOptions = {
			uri: 'http://' + config.router,
			method: 'POST',
			body: {
				jsonrpc: '2.0',
			    method: 'validateHost',
			    params: {host: params.host},
			    id: 0
			},
			json: true
		}

		await request(reqOptions)
			.then(body => {
				if (body.result.status === 'OK') 
					result = true;
			})
			.catch(err => {
				console.log(err);
			});

		return result;
	}
}

module.exports = functions;
