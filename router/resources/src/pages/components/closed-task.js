module.exports.component = {
    component: {
        props: ['task'],
        template: '<tr class="closed" @click="changeView">' +
            '<td>{{ task.name }}</td>' +
            '<td>{{ task.state }}</td>' +
            '<td>{{ task.change_date }}</td>' +
        '</tr>',
        methods: {
            changeView: function() {
                this.$emit('change-view', 'toActive');
            }
        }
    }
};