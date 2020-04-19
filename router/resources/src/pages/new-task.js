var taskServ;
var stateServ;

var restartConnection = async function(type, params, restart) {
    var url = type === 'task' ? taskServ.defaults.baseURL : stateServ.defaults.baseURL;

    var router = axios.create({
        url: '/',
        headers: {
            'content-type': 'application/json',
            accept: 'application/json',
        }
    });

    let reqOption = {
        jsonrpc: "2.0",
        method: "removeHost",
        params: {
            type: type,
            host: url.slice(7)
        },
        id: 0
    };

    var data;
    await router.post('', reqOption)
        .then(result => {
            url = 'http://' +  result.data.result.host;
        })
        .catch(err => {
            console.log("Router unavailable");
            console.log(err);
        })
    console.log(url);

    if (type === 'task')
        taskServ.defaults.baseURL = url
    else
        stateServ.defaults.baseURL = url;


    if (url != 'http://undefined') {
        await restart(params).then(result => {
            data = result;
            data.hostChanged = true;
        });
    }

    if (data === undefined) {
        data = {hostChanged: true};
    }

    return data;
};

var isAuthorized = async function(options) {
    var params = {
        jsonrpc: '2.0',
        method: 'isAuthorized',
        params: {},
        id: 0
    };

    //console.log(taskServ.defaults.baseURL, stateServ.defaults.baseURL);

    var data = {authorized:false}
    await taskServ.post('', params)
        .then(result => {
            if (result.data.result.authorized != undefined) {
                data = {authorized: result.data.result.authorized};
                console.log(data);
            }
        })
        .catch(async function(err) {
            console.log(err);
            await restartConnection('task', options, isAuthorized)
                .then(result => {
                    data = result;
                    data.host = taskServ.defaults.baseURL;
                });
        });

    return data;
};

var createTask = async function(options) {
	var currDate = new Date();

    var params = {
        jsonrpc: '2.0',
        method: 'isExist',
        params: {
            name: options.name,
            date: currDate.getFullYear() + '-' + (currDate.getMonth() + 1) + '-' + currDate.getDate()
        },
        id: 0
    };

    await taskServ.post('', params).then(result => {
        if(result.data.result.status === "OK") {
            params = {
                jsonrpc: '2.0',
                method: 'createTask',
                params: {
                    name: options.name,
                    description: options.description,
                    date: currDate.getFullYear() + '-' + (currDate.getMonth() + 1) + '-' + currDate.getDate()
                },
                id: 0
            };
    	}
    });

    if (params.method === 'createTask') {
	    await taskServ.post('', params).then(result => {
	        if(result.data.result.id != 0) {
	            params = {
	                taskId: result.data.result.id,
	                state: 0
	            };
	        }
	    });
	}

    return params;
}

var changeState = async function(options) {
    let currDate = new Date();

    console.log('change');
    
    var params = {
        jsonrpc: '2.0',
        method: 'updateState',
        params: {
            taskId: options.taskId,
            state: options.state,
            date: currDate.getFullYear() + '-' + (currDate.getMonth() + 1) + '-' + currDate.getDate()
        },
        id: 0
    };
    
    var data = 'ERROR';
    await stateServ.post('', params)
        .then(result => {
            if (result.data.result.status === 'OK') {
                data = 'OK';
                console.log(data);
            }
        })
        .catch(async function(err) {
            console.log(err);
            await restartConnection('state', options, changeState)
                .then(result => {
                    data = result;
                    data.host = stateServ.defaults.baseURL;
                });
        });

    return data;
};

module.exports.component = {
    component: {
        data: function () {
            return {
                name: '',
                description: '',
                error: ''
            }
        },
        template: '<div>' +
        	'<div id="header">' +
        		'<img class="dark-logo" src="/dark_logo">' +
        	'</div>' +
        	'<div class="body" style="padding: 10px;box-sizing: border-box;">' +
            	'<div class="title">Создать задание</div>' +
            	'<div>' +
            	    '<label>Название</label>' +
            	    '<input type="text" name="name" v-model="name" />' +
            	'</div>' +
            	'<div>{{ error }}</div>' +
            	'<div>' +
            	    '<label>Описание</label>' +
            	    '<input type="text" name="description" v-model="description" maxlenght="999" />' +
            	'</div>' +
            	'<button class="create" @click="emptyCheck">Создать</button>' +
            	'<button class="storage" @click="back">Назад</button>' +
            '</div>' +
        '</div>',
        methods: {
            back: function() {
                this.$emit('change-page', {name: 'ToMainPage', archived: 0});
            },
            emptyCheck: function() {
                if (this.name === '') {
                    this.error = 'Название не может быть пустым';
                }
                else
                    this.create();
            },
            create: function() {
            	isAuthorized().then(data => {
                    if (data.hostChanged) {
                        this.$root.$emit('conn-lost', {url: taskServ.defaults.baseURL, type: 'task'});
                    }

                    if (data.authorized) {
                    	let params = {
                    		name: this.name,
                    		description: this. description
                    	}

                        createTask(params).then(options => {
                        	if (options.taskId != undefined) {
                        		changeState(options).then(result => {
                                    if (result != undefined)
                                        this.$emit('change-page', {name: 'ToMainPage', archived: 0});
                                });
                        	}
                        	else
                        		this.error = 'Сегодня уже была создана задача с таким именем';
                        });
                    }
                    else 
                        this.$root.$emit('change-page', {name: 'LogInPage'});
                });
            }
        }
    }
};

module.exports.setTaskConnection = function(controller) {
    taskServ = controller;
};

module.exports.setStateConnection = function(controller) {
    stateServ = controller;
};