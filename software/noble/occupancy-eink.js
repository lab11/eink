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
var scale_value = 3;
var x_value = 50;
var y_value = 126;
var qrcode_value = "";
var control_value = 1;

var shouldUpdateDisplay = false;

function updateDoor()
{
	shouldUpdateDisplay = true;

	console.log("update started");

	if(noble.state == "poweredOn")
	{
		console.log("powered on");
		noble.startScanning();
	}
	else
	{
		console.log("not powered on");
		console.log(noble.state);
		setTimeout(updateDoor, 5000);
	}
}

noble.on('stateChange', function(state) {
  if (state === 'poweredOn')
    console.log("state: " + state);
  else
    console.log("state: " + state);
});

noble.on('discover', function(peripheral){
	console.log(peripheral.address);
	if(peripheral.address == einkAddress && peripheral.connectable && shouldUpdateDisplay)
	{
		shouldUpdateDisplay = false;
		peripheral.connect(function(error){
			if(error)
			{
				console.log("Peripheral connection error: " + error);
			}
			else
			{
				console.log("Connected to device");
				console.log("\nStarted writing to display");
				peripheral.discoverAllServicesAndCharacteristics(function(error, services, characteristics){
					//characteristics[0] = X COORDINATE
					//characteristics[1] = Y COORDINATE
					//characteristics[2] = SCALE
					//characteristics[3] = TEXT
					//characteristics[4] = QR CODE
					//characteristics[5] = CONTROL

					//X
					for(var i = 0; i < characteristics.length; i++)
					{	
						if(characteristics[i].uuid == x)
						{
							console.log("x");

							var x_buf = new Buffer(1);
							x_buf.writeUInt8(x_value, 0);
							characteristics[i].write(x_buf, false, function(error){
								if(error){console.log(error)};

					//Y
								for(var j = 0; j < characteristics.length; j++)
								{
									if(characteristics[j].uuid == y)
									{
										console.log("y");

										var y_buf = new Buffer(1);
										y_buf.writeUInt8(y_value, 0);
										characteristics[j].write(y_buf, false, function(error){
											if(error){console.log(error)};

					//SCALE
											for(var k = 0; k < characteristics.length; k++)
											{
												if(characteristics[k].uuid == scale)
												{
													console.log("scale");

													var scale_buf = new Buffer(1);
													scale_buf.writeUInt8(scale_value, 0);
													characteristics[k].write(scale_buf, false, function(error){
														if(error){console.log(error)};

					//TEXT
														for(var l = 0; l < characteristics.length; l++)
														{
															if(characteristics[l].uuid == text)
															{
																console.log("text");

																characteristics[l].write(new Buffer(text_value), false, function(error){
																	if(error){console.log(error)};

                    //CONTROL
																	for(var m = 0; m < characteristics.length; m++)
																	{
																		if(characteristics[m].uuid == control)
																		{
																			console.log("control");

																			var control_buf = new Buffer(1);
																			control_buf.writeUInt8(0x01, 0);
																			characteristics[m].write(control_buf, false, function(error){
																				if(error){console.log(error)};
																				peripheral.disconnect(function(error){
																					console.log(error);
																				});
																			});
																						
																		}
																	}
																});
															}
														}
													});
												}
											}

										});
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

			text_value = "Come on in!   ";
		} else {
			//set eink display to not occupied
			console.log("NOT occupied");

			text_value = "Nobody home :(";
		}
		updateDoor();
	});
});