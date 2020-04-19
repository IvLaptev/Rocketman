Vue.prototype.$eventBus = new Vue();

var pages = require('./pages');

var router = axios.create({
    url: '/',
    headers: {
        'content-type': 'application/json',
        accept: 'application/json',
    }
});
var taskServ;
var stateServ;

// TODO: redirecting to another server
// TODO: style

var app = new Vue({
    el: "#app",
    template: '<div>' +
        '<component v-bind:is="currentPage.component" @change-page="changePage" :data="tasks"/>' +
    '</div>',
    data: {
        pages: pages.pages,
        currentPage: pages.pages['login-page'],
        tasks: []
    },
    created: function() {
        let params = {
            jsonrpc: '2.0',
            method: 'getHost',
            params: {count: 2},
            id: 0
        };
        
        router.post('', params).then(result => {
            taskServ = axios.create({
                baseURL: 'http://' + result.data.result.host[1],
                headers: {
                    'content-type': 'application/json',
                    accept: 'application/json',
                },
                withCredentials: true
            });
            stateServ = axios.create({
                baseURL: 'http://' + result.data.result.host[0],
                headers: {
                    'content-type': 'application/json',
                    accept: 'application/json',
                },
                withCredentials: true
            });
            pages.setTaskConnection(taskServ);
            pages.setStateConnection(stateServ);
        });
    },
    methods: {
        changePage: function(event) {
            if (event.name === 'ToMainPage'){
                this.currentPage = this.pages['main-page'];

                let params = {
                    jsonrpc: '2.0',
                    method: 'getTasks',
                    params: {
                        archived: event.archived,
                        filter: event.filter
                    },
                    id: 0
                };
                
                taskServ.post('', params).then(result => {
                    this.tasks = result.data.result.tasks;
                    this.tasks.forEach((task, i, tasks) => {
                        task.creation_date = new Date(task.creation_date).toLocaleString().slice(0, 10);
                        
                        if (result.data.result.states[i].change_date != '-')
                            task.change_date = new Date(result.data.result.states[i].change_date).toLocaleString().slice(0, 10)
                        else
                            task.change_date = '-';
                        
                        if (result.data.result.states[i].state === 0)
                            task.state = 'Не выполнено'
                        else if (result.data.result.states[i].state === 1)
                            task.state = 'Выполнено'
                        else
                            task.state = 'Недоступно'
                        console.log(task);
                    });
                });
            }

            else if (event.name === 'CreateTask') {
                this.currentPage = this.pages['new-task'];
            }

            else if (event.name === 'LogInPage') {
                this.currentPage = this.pages['login-page'];
            }

            else if (event.name === 'SignUpPage') {
                this.currentPage = this.pages['signup-page'];
            }

            else if (event.name === 'ErrorPage') {
                this.currentPage = this.pages['error-page'];
            }
            console.log(event, this);
        },
        deleteTask: function(id) {
            this.tasks.forEach((task, i, tasks) => {
                if (task.task_id === id) {
                    this.tasks.splice(i, 1);
                }
            })
        }
    },
    mounted: function() {
        this.$root.$on('conn-lost', function(options) {
            if (options.type === 'task') {
                if (options.url != 'http://undefined') {
                    taskServ = axios.create({
                        baseURL: options.url,
                        headers: {
                            'content-type': 'application/json',
                            accept: 'application/json',
                        },
                        withCredentials: true
                    });
    
                    pages.setTaskConnection(taskServ);
                }
                else {
                    this.changePage({name: 'ErrorPage'});
                }
            }

            else {
                if (options.url != 'http://undefined') {
                    stateServ = axios.create({
                        baseURL: options.url,
                        headers: {
                            'content-type': 'application/json',
                            accept: 'application/json',
                        },
                        withCredentials: true
                    });
                    
                    pages.setStateConnection(stateServ);
                }
            }
        });
        this.$root.$on('change-page', function(event) {
            this.changePage(event);
        });
        this.$root.$on('delete-task', function(event) {
            this.deleteTask(event);
        });
    }
});