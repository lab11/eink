#!/usr/bin/env node

var fs = require('fs');

var mqtt = require('mqtt');

var conf_file = fs.readFileSync('./configuration.json');
var conf = JSON.parse(conf_file);

// Handle conf defaults
if ( ! ('mqttBroker' in conf) ) {
	conf.mqttBroker = 'mqtt://localhost';
}
if ( ! ('controlInvert' in conf) ) {
	conf.controlInvert = false;
}
if ( ! ('coalesceEvents' in conf) ) {
	conf.coalesceEvents = true;
}

console.log("connecting to " + conf.mqttBroker);
var client = mqtt.connect(conf.mqttBroker);

client.on('connect', function () {
	console.log('connected');

	client.subscribe(conf.controlTopic);

	var lastMessage = undefined;

	client.on('message', function (topic, message) {
		var msg_obj = JSON.parse(message.toString());

		var onoff = msg_obj[conf.controlKey];

		if ( typeof onoff == 'undefined' ) {
			console.log('Error: controlKey ' + conf.controlKey + ' not found in topic object:');
			console.log(msg_obj);
			return;
		}

		if ( conf.controlInvert ) {
			onoff = !onoff;
		}

		if ( conf.coalesceEvents ) {
			if ( lastMessage == onoff ) {
				return;
			}
			lastMessage = onoff;
		}

		if (onoff) {
			//set eink display to occupied
			console.log("occupied");
		} else {
			//set eink display to not occupied
			console.log("NOT occupied");
		}
	});
});