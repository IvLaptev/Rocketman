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
                '<div class="title">Регистрация</div>' +
            	'<div class="form-field">' +
            	    '<label title="Логин должен содержать не менее 6 символов без спецсимволоов">Логин</label>' +
            	    '<input title="Логин должен содержать не менее 6 символов без спецсимволоов" class="input-field" type="text" name="login" v-model="login" />' +
            	'</div>' +
            	'<div class="form-field">' +
            	    '<label title="Пароль должен содержать не менее 6 символов">Пароль</label>' +
            	    '<input title="Пароль должен содержать не менее 6 символов" class="input-field" type="password" name="password" v-model="password" />' +
            	'</div>' +
            	'<div class="error-message">{{ error }}</div>' +
            	'<input type="submit" class="submit" value="Зарегистрироваться" @click="registrate" />' +
                '<input type="submit" class="submit" value="Войти" @click="logIn" />' +
            '</div>' +
        '</div>',
        methods: {
            registrate: function () {
                this.error = '';

                if (this.login.length < 6) {
                    this.error = 'Логин не может быть короче 6 символов';
                    return 1;
                }
                if (this.password.length < 6) {
                    this.error = 'Пароль не может быть короче 6 символов';
                    return 1;
                }

                let params = {
                    jsonrpc: '2.0',
                    method: 'signUp',
                    params: {
                        login: this.login,
                        password: this.password
                    },
                    id: 0
                };
                taskServ.post('', params).then(result => {
                    if(result.status === 200)
                        if (result.data.result != undefined) {
                            if (result.data.result.status === 'OK') {
                                let event = {
                                    name: 'LogInPage'
                                }
                                this.$emit('change-page', event);
                            }
                            else if (result.data.result.status === 'NOT_UNIQUE')
                                this.error = 'Пользователь с таким именем уже существует';
                            else
                                this.error = 'В логине используются спецсимволы';
                        }
                });
            },
            logIn: function() {
                this.$emit('change-page', {name:'LogInPage'});
            }
        }
    }
};

module.exports.setConnection = function(controller) {
    taskServ = controller;
};