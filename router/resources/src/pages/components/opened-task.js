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
        props: ['task'],
        data: function() {
            return {
                btnClass: '{}',
                disabled: false
            }
        },
        template: '<tr class="opened"><td colspan="3">' +
            '<div class="title subtitle" @click="changeView">{{ task.name }}</div>' +
            '<button v-if="isDone()" :class="btnClass" @click="makeUndone" :disabled="task.is_archived === 1">Выполнено</button>' +
            '<button v-else :class="btnClass" @click="makeDone" :disabled="task.is_archived === 1">Не выполнено</button>' +
            '<button class="create" @click="setArchived" :disabled="task.is_archived === 1">В архив</button>' +
            '<div><label>Дата создания:</label> {{ task.creation_date }}</div>' +
            '<div><label>Дата изменения:</label> {{ task.change_date }}</div>' +
            '<label>Описание</label>' +
            '<div>{{ task.description }}</div>' +
        '</td></tr>',
        methods: {
            changeView: function() {
                this.$emit('change-view', 'toInactive');
            },
            isDone: function() {
                console.log(this.task)
                this.btnClass = this.task.state === 'Выполнено' ? 'done' : 'undone';
                return this.task.state === 'Выполнено';
            },
            makeDone: function() {
                // TODO: change style
                isAuthorized().then(data => {
                    if (data.hostChanged) {
                        this.$eventBus.$emit('conn-lost', {url: taskServ.defaults.baseURL, type: 'task'});
                    }

                    if (data.authorized) {
                        let params = {
                            state: 1,
                            taskId: this.task.task_id
                        };

                        changeState(params).then(result => {
                            if (result.hostChanged) {
                                this.$eventBus.$emit('conn-lost', {url: stateServ.defaults.baseURL, type: 'state'});
                            }

                            this.task.state = 'Выполнено';
                            this.btnClass = 'done';

                            var currDate = new Date(); 
                            this.task.change_date = currDate.toLocaleString().slice(0,10);
                        });
                    }
                    else 
                        this.$root.$emit('change-page', {name: 'LogInPage'});
                });
            },
            makeUndone: function() {
                // TODO: change style
                isAuthorized().then(data => {
                    if (data.hostChanged) {
                        this.$eventBus.$emit('conn-lost', {url: taskServ.defaults.baseURL, type: 'task'});
                    }

                    if (data.authorized) {
                        let params = {
                            state: 0,
                            taskId: this.task.task_id
                        };
        
                        changeState(params).then(result => {
                            console.log(result);
                            if (result.hostChanged) {
                                this.$eventBus.$emit('conn-lost', {url: stateServ.defaults.baseURL, type: 'state'});
                                console.log({url: stateServ.defaults.baseURL, type: 'state'});
                            }
        
                            this.task.state = 'Не выполнено';
                            this.btnClass = 'undone';
        
                            currDate = new Date();
                            this.task.change_date = currDate.toLocaleString().slice(0,10);
                        });
                    }
                    else 
                        this.$root.$emit('change-page', {name: 'LogInPage'});
                });
            },
            setArchived: function() {
                isAuthorized().then(data => {
                    if (data.hostChanged) {
                        this.$root.$emit('conn-lost', {url: taskServ.defaults.baseURL, type: 'task'});
                    }

                    if (data.authorized) {
                        let params = {
                            jsonrpc: '2.0',
                            method: 'setArchived',
                            params: {
                                taskId: this.task.task_id
                            },
                            id: 0
                        };
        
                        taskServ.post('', params).then(result => {
                            if (result.data.result.status === 'OK') {
                                this.$root.$emit('delete-task', this.task.task_id);
                            }
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