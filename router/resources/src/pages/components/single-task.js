var closedTask = require('./closed-task');
var openedTask = require('./opened-task');

module.exports.component = {
    props: ['task'],
    data: function() {
        return {
            taskView: closedTask.component,
            active: false
        }
    },
    template: '<component :is="taskView.component" @change-view="changeView" :task="task" />',
    methods: {
        changeView: function(event) {
            if (event === 'toActive')
                this.taskView = openedTask.component;
            else
                this.taskView = closedTask.component;
        }
    }
};

module.exports.setTaskConnection = function(controller) {
    openedTask.setTaskConnection(controller);
};

module.exports.setStateConnection = function(controller) {
    openedTask.setStateConnection(controller);
};