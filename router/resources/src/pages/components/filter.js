module.exports.component = {
    props: ['tasks'],
    data: function() {
        return {
            withDate: false,
            withState: false,
            error: '',
            days: [],
            months: [],
            years: [],
            startDay: 0,
            startMonth: 0,
            startYear: 0,
            endDay: 0,
            endMonth: 0,
            endYear: 0,
            state: ''
        }
    },
    template: '<div class="filter">' +
        '<div class="title">Выбрать задания</div>' +
        '<label for="date-field"><input type="checkbox" v-model="withDate" id="date-field" />За период</label>' +
        '<div v-if="withDate">' +
            '<div>Начало периода</div>' +
            '<select v-model="startDay" :disabled="!withDate">' +
                '<option disabled value="">День</option>' +
                '<option v-for="day in days" :key="day" :value="day">{{ day }}</option>' +
            '</select>' +
            '<select v-model="startMonth" :disabled="!withDate">' +
                '<option disabled value="">Месяц</option>' +
                '<option v-for="month in months" :key="month.value" :value="month.value">{{ month.text }}</option>' +
            '</select>' +
            '<select v-model="startYear" :disabled="!withDate">' +
                '<option disabled value="">Год</option>' +
                '<option v-for="year in years" :key="year" :value="year">{{ year }}</option>' +
            '</select>' +
        '</div>' +
        '<div v-if="withDate">' +
            '<div>Конец периода</div>' +
            '<select v-model="endDay" :disabled="!withDate">' +
                '<option disabled value="">День</option>' +
                '<option v-for="day in days" :key="day" :value="day">{{ day }}</option>' +
            '</select>' +
            '<select v-model="endMonth" :disabled="!withDate">' +
                '<option disabled value="">Месяц</option>' +
                '<option v-for="month in months" :key="month.value" :value="month.value">{{ month.text }}</option>' +
            '</select>' +
            '<select v-model="endYear" :disabled="!withDate">' +
                '<option disabled value="">Год</option>' +
                '<option v-for="year in years" :key="year" :value="year">{{ year }}</option>' +
            '</select>' +
        '</div>' +
        '<div class="error-message">{{ error }}</div>' +
        '<label for="state-field"><input type="checkbox" v-model="withState" id="state-field" />Со статусом</label>' +
        '<div v-if="withState">' +
            '<label for="done"><input type="radio" v-model="state" id="done" value="1" :disabled="!withState">Выполненные</label>' +
            '<label for="undone"><input type="radio" v-model="state" id="undone" value="0" :disabled="!withState">Не выполненные</label>' +
        '</div>' +
        '<input type="submit" class="submit" @click="apply" value="Выбрать" />' +
    '</div>',
    created: function() {
        this.months = [
            {value: 1, text: 'января'},
            {value: 2, text: 'февраля'},
            {value: 3, text: 'марта'},
            {value: 4, text: 'апреля'},
            {value: 5, text: 'мая'},
            {value: 6, text: 'июня'},
            {value: 7, text: 'июля'},
            {value: 8, text: 'августа'},
            {value: 9, text: 'сентября'},
            {value: 10, text: 'октября'},
            {value: 11, text: 'ноября'},
            {value: 12, text: 'декабря'}
        ];
        var date = new Date();

        for (let i = 1; i <= 31; i++) {
            this.days.push(i);
        }
        for (let i = date.getFullYear(); i >= 2000; i--) {
            this.years.push(i);
        }
    },
    methods: {
        apply: function() {
            this.error = '';
            
            var params = {}
            if (this.withDate) {
                if (this.startDay * this.startMonth * this.startYear === 0)
                    params.startDate = '2000-1-1'
                else
                    params.startDate = this.startYear + '-' + this.startMonth + '-' + this.startDay;

                if (this.endDay * this.endMonth * this.endYear === 0) {
                    let currDate = new Date();
                    params.endDate = currDate.getFullYear() + '-' + (currDate.getMonth() + 1) + '-' + currDate.getDate();
                }
                else
                    params.endDate = this.endYear + '-' + this.endMonth + '-' + this.endDay;
            }

            if (this.withState && this.state != '') {
                params.state = this.state;
            }

            if (new Date(params.startDate) > new Date(params.endDate)) {
                this.error = "Дата начала периода не может быть позже даты окончания";
            }
            else {
                this.$emit('apply', params);
            }
        }
    }
};