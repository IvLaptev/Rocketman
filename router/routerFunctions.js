const config = require('./config/config.json');
const fs = require('fs');

var taskHosts;
var stateHosts;

const functions = {
	getHost: function(params) {
		var host = [];

		host.push(stateHosts[0]);
		stateHosts.push(stateHosts.shift());
		if (params.count === 2) {
			host.push(taskHosts[0]);
			taskHosts.push(taskHosts.shift());
		}

		console.log({host: host});

		return {host: host};
	},
	refreshHosts: function() {
		let newHosts = JSON.parse(fs.readFileSync('./config/hosts.json'));

		console.log(newHosts);
		taskHosts = newHosts.taskHosts;
		stateHosts = newHosts.stateHosts;
	},
	removeHost: function(params) {
		let host;
		if (params.type === 'task') {
			console.log(`Task service's host (${params.host}) was removed`);

			var index = taskHosts.indexOf(params.host);
			if (index > -1) {
				taskHosts.splice(index, 1);
			}

			host = taskHosts[0];
			taskHosts.push(taskHosts.shift());

			console.log(taskHosts);
		}
		else {
			console.log(`State service's host (${params.host}) was removed`);

			var index = stateHosts.indexOf(params.host);
			if (index > -1) {
				stateHosts.splice(index, 1);
			}

			host = stateHosts[0];
			stateHosts.push(stateHosts.shift());

			console.log(stateHosts);
		}
		return {host: host};
	},
	validateHost: function(params) {
		let hosts = taskHosts.join(':');
		if (hosts.indexOf(params.host) != -1)
			return {status: 'OK'}
		else
			return {status: 'ERROR'};
	}
}

module.exports = functions;
