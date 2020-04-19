var singleTask = require('./single-task');

module.exports.component = {
    props: ['tasks'],
    components: {
        'single-task': singleTask.component 
    },
    template: '<div class="table"><table>' +
        '<thead>' +
            '<tr>' +
                '<th>Название</th>' +
                '<th style="width: 140px;">Статус</th>' +
                '<th style="width: 200px;">Последнее изменение</th>' +
            '</tr>' +
        '</thead>' +
        '<tbody>' +
            '<single-task v-for="task in tasks" :key="task.task_id" :task="task" />' +
        '</tbody>' +
    '</table></div>'
};

module.exports.setTaskConnection = function(controller) {
    singleTask.setTaskConnection(controller);
};

module.exports.setStateConnection = function(controller) {
    singleTask.setStateConnection(controller);
};