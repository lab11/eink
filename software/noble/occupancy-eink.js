#!/usr/bin/env node

var fs = require('fs');
var noble = require('noble');
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


var einkAddress = conf.einkAddress;
console.log(einkAddress);

var text =       "e528a410ff4f3089d44f7cb505aba641";
var scale =      "e528a413ff4f3089d44f7cb505aba641";
var x =          "e528a411ff4f3089d44f7cb505aba641";
var y =          "e528a412ff4f3089d44f7cb505aba641";
var qrcode =     "e528a414ff4f3089d44f7cb505aba641";
var control =    "e528a415ff4f3089d44f7cb505aba641";

var text_value = "";
var scale_value = 1;
var x_value = 0;
var y_value = 0;
var qrcode_value = "";
var control_value = 0;

function updateDoor()
{
	console.log("update started");

	if(noble.state == "poweredOn")
	{
		console.log("powered on");
		noble.startScanning();
	}
	else
	{
		console.log("not powered on");
		while(noble.state != "poweredOn")
		{
			if(noble.state == "poweredOn")
			{
				updateDoor();
			}
		}
	}
}

noble.on('discover', function(peripheral){
	console.log(peripheral.address);
	if(peripheral.address == einkAddress && peripheral.connectable)
	{
		peripheral.connect(function(error){
			if(error)
			{
				console.log("Peripheral connection error: " + error);
			}
			else
			{
				peripheral.discoverAllServicesAndCharacteristics(function(error, services, characteristics){
					//characteristics[0] = X COORDINATE
					//characteristics[1] = Y COORDINATE
					//characteristics[2] = SCALE
					//characteristics[3] = TEXT
					//characteristics[4] = QR CODE
					//characteristics[5] = CONTROL
					for(var i = 0; i < characteristics.length; i++)
					{
						if(characteristics[i].uuid == text)
						{
							characteristics[i].write(Buffer.from(text_value), false, function(error){
								if(error)
								{
									console.log(error);
								}
								else
								{
									console.log("wrote to text");

									for(var i = 0; i < characteristics.length; i++)
									{
										if(characteristics[i].uuid == control)
										{
											var buf = new Buffer(1);
											buf.writeUInt8(0x1, 0);

											characteristics[i].write(buf, false, function(error){
												console.log(error);
												peripheral.disconnect(function(error){
													console.log(error);
												});
											});
										}
									}
								}
							});
						}
					}
				});
			}

		});
	}
});



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

			text_value = "Come on in!";
		} else {
			//set eink display to not occupied
			console.log("NOT occupied");

			text_value = "Nobody home";
		}
		updateDoor();
	});
});