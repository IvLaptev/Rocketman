const mysql = require('mysql2');
const config = require('./config.json');
const request = require('request-promise');
const bcrypt = require('bcryptjs');

var url;								// Адрес stateService

// Параметры запроса router
let reqOptions = {						
	uri: 'http://' + config.router,
	method: 'POST',
	body: {
		jsonrpc: '2.0',
	    method: 'getHost',
	    params: {count: 1},
	    id: 0
	},
	json: true
}

request(reqOptions)						// Получение адреса taskService
	.then(body => {
		url = body.result.host[0];
	})
	.catch(err => {
		console.log(err);
	});

// Подключение к базе данных
const database = mysql.createConnection({
	//connectionLimit: 5,
	host: config.dbHost,
	port: config.dbPort,
	database: config.dbName,
	user: config.dbUser,
	password: config.dbPass
}).promise();

/* Вспомогательная функция для получения адреса другого stateService, если текущий
* не работает до тех пор, пока не будут испробованные все существующие в router
* restart - функция, которую необходимо перезапустить при подключении к новому stateService
* params - параметры restart
*/
var changeHost = async function(params, restart) {
    let reqOptions = {
		uri: 'http://' + config.router,
		method: 'POST',
		body: {
			jsonrpc: "2.0",
    		method: "removeHost",
    		params: {
    			type: "state",
    			host: url
    		},
    		id: 0
		},
		json: true
	}

	await request(reqOptions)	// Получение нового адреса stateService
		.then(body => {
			url = body.result.host;
			params.uri = 'http://' + url;
		})
		.catch(err => {
			console.log("Router unavailable");
			console.log(err);
		});

    var data;

    if (url != null) {
        await restart(params).then(result => {	// запуск функции, на которой прервалось соединение
            data = result;
        });
    }

    return data;
};

/*
* Набор базовых функций сервиса, которые также представляют его API
* params - набор параметров, различный для каждой функции, целостность которого
*		   проверяется в checkParams
*/
const functions = {
	/*
	* Функция входа в систему
	* Происходит в два шага: получение соли для хэширования пароля и проверка введённого пароля
	*/
	logIn: async function(params) {
		var wrongData = /\W/.test(params.login);	// Проверка логина на спецсимволы
		var result = { authorized: false };

		if (!wrongData) {
			await database.query(`SELECT user_id, password FROM users WHERE login='${params.login}';`)
				.then(([data, fields]) => {
					if (data[0] != undefined) {
						// Ветвь отправки соли
						if (params.needSalt === true) {
							result = { salt: data[0].password.slice(0,29) };
						}
						// Ветвь валидации пароля
						else {
							console.log(bcrypt.compareSync(data[0].password, params.password));
							if (bcrypt.compareSync(data[0].password, params.password)) 
								result = {
									authorized: true,
									userId: data[0].user_id
								}
						}
					}
				})
				.catch(err => {
					console.log(err);
				});
			return result;
		}
		return result;	// Отправка ошибки ввода логина при использзовании спецсимволов
	},
	// Получение статусов заданий из stateService
	getStates: async function(params) {
		var result = {};
		await request(params)
			.then(body => {
				result = body.result.states;
			})
        	.catch(async function(err) {
        	    console.log(err);
        	    await changeHost(params, functions.getStates)
        	        .then(data => {
        	            result = data;
        	        });
        	});
		return result;
	},
	/*
	* Получение информации о заданиях
	* Используется для получения фильтрованного и нефильтрованного списка заданий
	* Для получения фильтрованного списка используется поле filter входных параметров 
	*/
	getTasks: async function(params) {
		var result = {};

		// Формирование запроса с учётом фильтра
		var conditions = `user_id=${params.userId} AND is_archived=${params.archived}`;
		if (params.filter != undefined) {
			if (params.filter.startDate != undefined) {
				conditions = conditions + ` AND creation_date BETWEEN '${params.filter.startDate}' AND '${params.filter.endDate}'`;
			}
		}

		await database.query(`SELECT *` +
							 ` FROM tasks` +
							 ` WHERE ${conditions}` +
							 ` ORDER BY task_id DESC;`)
			.then(([data, fields]) => {
				result.tasks = data;
			})
			.catch(err => {
				console.log(err);
				result.tasks = null;
			});
			
		var taskIds = [];	// Список номеров выбранных заданий
		result.tasks.forEach((task, i, tasks) => {
			taskIds.push(task.task_id);
		})

		// Формирование запроса к stateService
		var stateReqOptions = {
			uri: 'http://' + url,
			method: 'POST',
			body: {
				jsonrpc: '2.0',
	            method: 'getStates',
	            params: {taskIds: taskIds},
	            id: 0
			},
			json: true
		}

		var selectedStates = [];	// Хранит ответ stateService
		await functions.getStates(stateReqOptions)	// Получение статусов заданий
			.then(states => {
				selectedStates = states != undefined ? states : [];
			});

		result.states = [];		// Формирование конечного списка задач
        result.tasks.forEach((task, j, tasks) => {
            selectedStates.forEach((state, i, states) => {
                if (task.task_id === state.task_id) {
                    result.states.push(state);
                }
            });
			
			// Заполнение задач для которых нет статуса
            if (result.states[j] === undefined) {	
                result.states.push({
                    task_id: task.task_id,
                    state: -1,
                    change_date: '-'
                });
            }
        });

        // Удаление лишних записей при наличии фильтра по статусу
        if (params.filter != undefined) {
        	if (params.filter.state != undefined) {
        		for (var i = 0; i < result.states.length; i++) {
        			if (result.states[i].state != params.filter.state && result.states[i].state != -1) {
        				result.states.splice(i, 1);
        				result.tasks.splice(i, 1);
        				i--;
        			}
        		}
        	}
        }

		return result;
	},
	// Проверка наличия задания с введённым названием, созданного в этот же день
	isExist: async function(params) {
		var result = {};
		await database.query(`SELECT *` +
							 ` FROM tasks` +
							 ` WHERE user_id=${params.userId} AND name='${params.name}' AND creation_date='${params.date}';`)
			.then(([data, fields]) => {
				if (data[0] === undefined) 
					result = {status: 'OK'}			// Задание с таким же названием отсутствует
				else {
					result = {status: 'EXISTING'}	// Задание с таким же названием уже было создано за этот день
				}
			})
			.catch(err => {
				console.log(err);
				result = {status: 'ERROR'};
			});
		return result;
	},
	/*
	* Создание задания в базе
	* Состоит из создания в базе данных нового задания и отправки номера этого задания на клиент
	*/
	createTask: async function(params) {
		var result = {id: 0};	// Создание задания
		await database.query(`INSERT tasks(user_id, name, description, creation_date)` +	
							 ` VALUES(${params.userId}, "${params.name}", "${params.description}", "${params.date}");`)
			.catch(err => {
				console.log(err);
			});
		// Получение номера задания
		await database.query(`SELECT task_id` +
							 ` FROM tasks` +
							 ` WHERE user_id=${params.userId} AND name='${params.name}' AND creation_date='${params.date}'`)
			.then(([data, fields]) => {
				if (data[0] != undefined)
				result.id = data[0].task_id;
			})
			.catch(err => {
				console.log(err);
			});
		return result;
	},
	setArchived: async function(params) {	// Установка флага помещения задания в архив
		var result = {};
		await database.query(`UPDATE tasks SET is_archived=1 WHERE task_id=${params.taskId} AND user_id=${params.userId};`)
			.then(([data, fields]) => {
				result = {status: 'OK'}
			})
			.catch(err => {
				console.log(err);
				result = {status: 'ERROR'};
			});
		return result;
	},
	signUp: async function(params) {	// Создание аккаунта
		var result = {};
		var wrongData = /\W/.test(params.login);	// Проверка логина на спецсимволы

		if (wrongData) 
			return {status: 'WRONG_DATA'};
		
		await database.query(`SELECT user_id FROM users WHERE login='${params.login}';`)	// Проверка существования
			.then(([data, fields]) => {														// пользователя с тем же логином
				if (data[0] != undefined) {
					result.status = 'NOT_UNIQUE';
				}
			})
			.catch(err => {
				console.log(err);
				result = {status: 'ERROR'};
			});
		if (result.status != undefined)
			return result;

		var salt = bcrypt.genSaltSync(10);
		var password = bcrypt.hashSync(params.password);

		await database.query(`INSERT users(login, password) VALUES('${params.login}', '${password}');`)
			.then(([data, fields]) => {
				result.status = 'OK';
			})
			.catch(err => {
				console.log(err);
				result = {status: 'ERROR'};
			});

		return result;
	}
}

module.exports = functions;

/*
* Проверка параметров функции
* Данная функция является вспомогательной и служит для защиты от запросов,
* которые передают имя существующей функции, но отправляют ошибочный набор параметров.
*/
var checkParams = {
	logIn: function(params) {
		if (params) {
			var correctSalt = params.needSalt === true;
			return params.login && (correctSalt || params.password);
		}
		return false;
	},
	getTasks: function(params) {
		if (params) {
			var correctArchived = params.archived === 0 || params.archived === 1;
			var correctState = true;
			var correctDate = true;

			if (params.filter) {
				if (params.filter.state != undefined)
					correctState = params.filter.state === '0' || params.filter.state === '1';
				if (params.filter.startDate != undefined)
					correctDate = params.filter.endDate != undefined;
			}
			return correctDate && correctState && correctArchived;
		}
		return false;
	},
	isExist: function(params) {
		if (params) {
			var correctName = params.name != false;
			return correctName && params.date;
		}
		return false;
	},
	createTask: function(params) {
		if (params) {
			var correctName = params.name != false;
			var correctDescription = params.description != false;
			return correctName && correctDescription && params.date;
		}
		return false;
	},
	setArchived: function(params) {
		if (params) {
			return params.taskId;
		}
		return false;
	},
	signUp: function(params) {
		if (params) {
			return params.login && params.password;
		}
		return false;
	}
}

module.exports.checkParams = checkParams;