var filter = require('./components/filter');
var taskTable = require('./components/task-table')

module.exports.component = {
    component: {
        props: ['data'],
        data: function() {
            return {
                fileredTasks: [],
                archived: 0
            }
        },
        components: {
            'task-filter': filter.component,
            'task-table': taskTable.component
        },
        template: '<div style="width: 100%;">' +
            '<div id="header">' +
                '<img class="dark-logo" src="/dark_logo">' +
            '</div>' +
            '<div class="body">' +
                '<task-filter @apply="filterTasks" :tasks="data" />' +
                '<div class="task-field">' +
                    '<button class="create" @click="createTask">Создать</button>' +
                    '<button class="storage" @click="showActive" v-if="archived">Активные</button>' +
                    '<button class="storage" @click="showArchived" v-else>Архив</button>' +
                    '<task-table :tasks="data" />' +
                '</div>' +
            '</div>' +
        '</div>',
        methods: {
            createTask: function() {
                this.$emit('change-page', {name: 'CreateTask'});
            },
            showActive: function() {
                this.archived = 0;
                this.$emit('change-page', {name: 'ToMainPage', archived: 0});
            },
            showArchived: function() {
                this.archived = 1;
                this.$emit('change-page', {name: 'ToMainPage', archived: 1});
            },
            filterTasks: function (params) {
                this.$emit('change-page', {name: 'ToMainPage', archived: this.archived, filter: params});
            }
        }
    }
};

module.exports.setTaskConnection = function(controller) {
    taskTable.setTaskConnection(controller);
};

module.exports.setStateConnection = function(controller) {
    taskTable.setStateConnection(controller);
};