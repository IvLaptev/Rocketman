var taskServ;

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

var getHash = async function(options) {
    let params = {
        jsonrpc: '2.0',
        method: 'logIn',
        params: {
            login: options.login,
            needSalt: true
        },
        id: 0
    };

    var data = {};
    await taskServ.post('', params)
        .then(result => {
            if (result.data.result != undefined) {
                if (result.data.result.salt != undefined) {
                    let bcrypt = dcodeIO.bcrypt;
                    data.hash = bcrypt.hashSync(options.password, result.data.result.salt);
                    data.hash = bcrypt.hashSync(data.hash, 10);
                }
                else
                    data.error = 'Введены неверные данные';
            }
        })
        .catch(async function(err) {
            console.log(err);
            await restartConnection('task', options, getHash)
                .then(result => {
                    data = result;
                    data.host = taskServ.defaults.baseURL;
                });
        });

    return data;
};

module.exports.component = {
    component: {
        data: function() {
            return {
                error: '',
                login: '',
                password: ''
            }
        },
        template: '<div id="log-in-page">' +
            '<div class="login-form">' +
                '<img class="light-logo" src="/light_logo">' +
                '<div class="title">Вход</div>' +
                '<div class="form-field">' +
                    '<label>Логин</label>' +
                    '<input class="input-field" type="text" name="login" v-model="login" />' +
                '</div>' +
                '<div class="form-field">' +
                    '<label>Пароль</label>' +
                    '<input class="input-field" type="password" name="password" v-model="password" />' +
                '</div>' +
                '<div class="error-message">{{ error }}</div>' +
                '<input type="submit" class="submit" value="Войти" @click="authorize" />' +
                '<input type="submit" class="submit" value="Зарегистрироваться" @click="signUp" />' +
            '</div>' +
        '</div>',
        methods: {
            authorize: function () {
                this.error = '';

                // Authorization: start

                getHash({login: this.login, password: this.password}).then(data => {
                    if (data.hostChanged) {
                        this.$root.$emit('conn-lost', {url: taskServ.defaults.baseURL, type: 'task'});
                    }

                    if (data.error != undefined) 
                        this.error = data.error
                    else {
                        let params = {
                            jsonrpc: '2.0',
                            method: 'logIn',
                            params: {
                                login: this.login,
                                password: data.hash
                            },
                            id: 0
                        };

                        taskServ.post('', params).then(result => {
                            if (result.data.result != undefined) {
                                if (result.data.result.authorized) {
                                    let event = {
                                        name: 'ToMainPage',
                                        archived: 0
                                    }
                                    this.$emit('change-page', event);
                                }
                                else
                                    this.error = 'Введены неверные данные';
                            }
                        });
                    }
                });
            },
            signUp: function() {
                this.$emit('change-page', {name: 'SignUpPage'});
            }
        }
    }
};

module.exports.setConnection = function(controller) {
    taskServ = controller;
};