/* JavaScript for Template Summon UI */

var deviceId = "C0:98:E5:00:F8:02";                                                 // while testing, replace with address of a BLE peripheral
var deviceName = "E-Ink disp";                                                      // while testing, replace with desired name
var serviceUuid  = "e528a44a-ff4f-3089-d44f-7cb505aba641";                               // example service UUID to access
var textUuid     = "e528a410-ff4f-3089-d44f-7cb505aba641";                        // example characteristic UUID to read or write
var xcoordUuid   = "e528a411-ff4f-3089-d44f-7cb505aba641";
var ycoordUuid   = "e528a412-ff4f-3089-d44f-7cb505aba641";
var scaleUuid    = "e528a413-ff4f-3089-d44f-7cb505aba641";
var qrcodeUuid   = "e528a414-ff4f-3089-d44f-7cb505aba641";
var controlUuid  = "e528a415-ff4f-3089-d44f-7cb505aba641";

var timer;

var last_update = 0;

var switch_visibility_console_check = "visible";
var switch_visibility_steadyscan_check = "visible";

var bluetoothEnabled = false;

// Load the swipe pane
$(document).on('pageinit',function(){
    $("#main_view").on("swipeleft",function(){
        $("#logPanel").panel( "open");
    });
});


function stringToBytes(string) {
    var array = new Uint8Array(string.length + 1);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }

    array[string.length] = '\0';
    return array.buffer;
}

function numberToBuffer(string)
{
    string = string.substring(0, 8);
    var num = parseInt(string);
    var data = new Uint16Array([num]).buffer;
    return data;
}

function textToBytes(index, text)
{
    text = " " + text;
    var array;
    if(index == 0)
    {
        array = new Uint8Array(text.length + 2);
    }
    else
    {
        array = new Uint8Array(text.length + 1);
    }
    
    for(var i = 0, l = text.length; i < l; i++)
    {
        array[i] = text.charCodeAt(i);
    }

    if(index == 0)
    {
        array[text.length] = '\0';
    }
    array[0] = index;
    return array.buffer;
}

//write
var wroteSuccessfully = false;

//write text buffer
function writeTextBuffer(chunks, index, callback)
{
    var buffer = textToBytes(index, chunks[chunks.length - 1 - index]);

    ble.write(deviceId, serviceUuid, textUuid, buffer, function(){
        if(index > 0){
            index--;
            buffer = textToBytes(index, chunks[chunks.length - 1 - index]);

            writeTextBuffer(chunks, index, callback);
        }
        else
        {
            callback();
        }
    }, function(error){
        console.log(error);
    });
}

//write buffer
var writeBufferAttempts = 0;
function writeBuffer(charUuid, buffer, callback)
{
    ble.isConnected(deviceId, function(){
        ble.write(deviceId, serviceUuid, charUuid, buffer, function(){
            console.log("wrote to " + charUuid + " successfully"); 
            wroteSuccessfully = true;

            callback();

        }, function(error){
            console.log("62Error: " + error + "  ID: " + charUuid + " Buffer Length: " + buffer.byteLength);
            if(writeBufferAttempts < 5)
            {
                writeBuffer(charUuid, buffer, callback);
            }
        });
    }, function(){
        console.log("NOT CONNECTED AT TIME OF WRITE");
        writeConnect(charUuid, buffer, callback);
    });
}

//write connect
var writeConnectionAttempts = 0;
function writeConnect(charUuid, buffer, callback)
{
    console.log("connection attempt");
    bluetooth.connect(deviceId, function(peripheral){
        console.log("CONNECTION SUCCESSFUL");
        console.log(JSON.stringify(peripheral, null, 2));

        ble.stopScan(function(){
            console.log("scan stopped");
        }, function(error){
            console.log("scan stop error: " + error);
        });

        console.log("started write");
        writeBuffer(charUuid, buffer, callback);

    }, function(error){
        console.log(JSON.stringify(error));
        writeConnect(charUuid, buffer, callback);
    });
    
}

//write scanner
function scanConnectWrite(charUuid, buffer, callback)
{
    var found = false;
    if(bluetoothEnabled)
    {
        bluetooth.scan([], 10, function(device){
            console.log("scan");
            if(device.id == deviceId)
            {
                found = true;

                writeConnect(charUuid, buffer, callback);
            }
        }, function(error){
            console.log("scan error: " + error);
            scanConnectWrite(charUuid, buffer, callback);
        });
    }
}

function disconnect(callback)
{
    //if connected, then disconnect
    ble.isConnected(deviceId, function(){
        ble.disconnect(deviceId, function(){
            console.log("successfully disconnected");
            disconnectAttempts = 0;

            callback();
        }, function(error){
            console.log("error disconnecting: " + error);
        });
    }, function(error){
        console.log("Not connected when attempting to disconnect");

        callback();
    });
}

//write x
function writeX(callback)
{
    wroteSuccessfully = false;
    console.log("started x");
    var buffer = numberToBuffer($("#xcoordinateinput").val());
    scanConnectWrite(xcoordUuid, buffer, callback);
}

//write y
function writeY(callback)
{
    wroteSuccessfully = false;
    console.log("started y");
    var buffer = numberToBuffer($("#ycoordinateinput").val());
    
    //scanConnectWrite(ycoordUuid, buffer, callback);

    writeBuffer(ycoordUuid, buffer, callback);
}

//write scale
function writeScale(callback)
{
    wroteSuccessfully = false;
    console.log("started scale");
    var buffer = new Uint8Array([$("#scaleInput").val()]).buffer;

    //scanConnectWrite(scaleUuid, buffer, callback);

    writeBuffer(scaleUuid, buffer, callback);
}

//write text
function writeText(callback)
{
    wroteSuccessfully = false;
    console.log("started text");

    var text = $("#textinput").val();
    var chunks = text.match(/.{1,18}/g);
    console.log(chunks);
    var index = chunks.length - 1;
    console.log("Index: " + index);

    //scanConnectWrite(textUuid, buffer, callback);

    //writeBuffer(textUuid, buffer, callback);

    writeTextBuffer(chunks, index, callback);
}

//write qrcode
function writeQRcode(callback)
{
    wroteSuccessfully = false;
    console.log("started qr code");
    var buffer = stringToBytes($("#qrcodeinput").val().substring(0,52));

    scanConnectWrite(qrcodeUuid, buffer, callback);
}

//write command
function writeControl(callback)
{
    var shouldClear = $("#flip-1").val() == "on";
    var control = 0;
    if(shouldClear)
    {
        control = 2;//clear
    }
    else
    {
        control = 1;//update display
    }
    var buffer = new Uint8Array([control]).buffer;

    writeBuffer(controlUuid, buffer, callback);
}

//write text to ble
var wroteTextSuccessfully = false;
function writeBLEtext()
{
    wroteTextSuccessfully = false;
    var tries = 0;
    if(bluetoothEnabled)
    {
        bluetooth.startScan([], function(device){
            if (device.id == deviceId && tries < 5 && wroteTextSuccessfully == false)
            {
                tries++;
                console.log("Found " + deviceName + " (" + deviceId + ")!");
                bluetooth.connect(device.id, function(){
                    console.log("CONNECTION SUCCESSFUL");

                    //convert text to format for write
                    var buffer = stringToBytes($("#textinput").val());
                    console.log("created buffer");

                    console.log("started write");
                    ble.write(deviceId, serviceUuid, textUuid, buffer, function(){console.log("wrote successfully"); wroteTextSuccessfully = true;}, function(error){console.log("error: " + error)});

                }, function(error){
                    console.log(JSON.stringify(error));
                });
            }
            else if(wroteTextSuccessfully == false)
            {
                // HACK:
                bluetooth.stopScan();
                bluetooth.startScan([], app.onDiscover, app.onAppReady);
            }
        }, function(){//didn't find anything to connect to
            console.log("Didn't find anything to connect to");
        });  
    }
}

var app = {
    // Application Constructor
    initialize: function() {
        console.log("init");

        document.addEventListener("deviceready", app.onAppReady, false);
        document.addEventListener("resume", app.onAppReady, false);
        document.addEventListener("pause", app.onPause, false);
        
        if (typeof window.gateway != "undefined") { // if UI opened through Summon,
            app.onAppReady();
        }
    },
    // App Ready Event Handler
    onAppReady: function() {
        console.log("onAppReady");

        // Setup update for last data time
        setInterval(app.update_time_ago, 5000);

        if (typeof window.gateway != "undefined") {                               // if UI opened through Summon,
            deviceId = window.gateway.getDeviceId();                                // get device ID from Summon
            deviceName = window.gateway.getDeviceName();                            // get device name from Summon
            console.log("Opened via Summon..");
        }
        
        console.log("Checking if ble is enabled...");
        bluetooth.isEnabled(app.onEnable);                                                // if BLE enabled, goto: onEnable
        // app.onEnable();
    },
    // App Paused Event Handler
    onPause: function() {
        console.log("on Pause");                                                           // if user leaves app, stop BLE
        bluetooth.stopScan();
    },
    // Bluetooth Enabled Callback
    onEnable: function() {
        console.log("onEnable");
        bluetoothEnabled = true;

        // app.onPause();                                                              // halt any previously running BLE processes
        //bluetooth.startScan([], app.onDiscover, app.onAppReady);                          // start BLE scan; if device discovered, goto: onDiscover
        //console.log("Searching for " + deviceName + " (" + deviceId + ").");
    },
    // BLE Device Discovered Callback
    onDiscover: function(device) {
        if (device.id == deviceId && wroteSuccessfully == false) {
            console.log("Found " + deviceName + " (" + deviceId + ")!");
            bluetooth.connect(device.id, function(){
                console.log("CONNECTION SUCCESSFUL");

                //convert text to format for write
                var buffer = stringToBytes($("#textinput").val());
                console.log("created buffer");

                var xcoordinate = $("#xcoordinateinput").val();
                var ycoordinate = $("#ycoordinateinput").val();
                var scale = $("#scaleinput").val();

                //write x coord, y coord, and scale
                /*
                ble.write(deviceId, serviceUuid, xcoordUuid, xcoordinate, console.log("xcoord written"), console.log("xcoord failed"));
                ble.write(deviceId, serviceUuid, ycoordUuid, ycoordinate, console.log("ycoord written"), console.log("ycoord failed"));
                ble.write(deviceId, serviceUuid, scaleUuid, scale, console.log("scale written"), console.log("scale failed"));
                */

                console.log("started write");
                ble.write(deviceId, serviceUuid, textUuid, buffer, function(){console.log("wrote successfully"); wroteSuccessfully = true;}, function(error){console.log("error: " + error)});

            }, function(error){console.log("Connection error: " + error)});
        } else{
            //console.log('Not Blink (' + device.id + ')');

            // HACK:
            bluetooth.stopScan();
            bluetooth.startScan([], app.onDiscover, app.onAppReady);
        }
    },
   onParseAdvData: function(device){
        //Parse Advertised Data
        var advertisement = device.advertisement;
        console.log("Found: " + advertisement.localName);

    },
    update_time_ago: function () {
        if (last_update > 0) {
            // Only do something after we've gotten a packet
            // Default output
            var out = 'Haven\'t gotten a packet in a while...';

            var now = Date.now();
            var diff = now - last_update;
            if (diff < 60000) {
                // less than a minute
                var seconds = Math.round(diff/1000);
                out = 'Last updated ' + seconds + ' second';
                if (seconds != 1) {
                    out += 's';
                }
                out += ' ago';

            } else if (diff < 120000) {
                out = 'Last updated about a minute ago';
            }
        }
    },
    // Function to Log Text to Screen
    log: function(string) {
        document.querySelector("#console").innerHTML += (new Date()).toLocaleTimeString() + " : " + string + "<br />";
        document.querySelector("#console").scrollTop = document.querySelector("#console").scrollHeight;
    }
};


function clicked()
{
    console.log($("#scaleInput").val());

    wroteSuccessfully = false;
    bluetooth.isEnabled(app.onEnable);  
    console.log("CLICKED!");

    disconnect(function(){
        //check if you should write qr code or text
        var qrcodeAddress = $("#qrcodeinput").val();
        if(qrcodeAddress.length > 0)
        {
            writeQRcode(function(){
                console.log("Successfully wrote qr code");
                writeControl(function(){
                    disconnect(function(){
                        console.log("write text disconnect");
                    });
                });
            });
        }
        else
        {
            writeX(function(){
                writeY(function(){
                    writeScale(function(){
                        writeText(function(){
                            writeControl(function(){
                                disconnect(function(){
                                    console.log("write text disconnect");
                                });
                            });
                        });
                    });
                });
            });
        }
    });
}

app.initialize();
