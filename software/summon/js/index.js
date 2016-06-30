/* JavaScript for Template Summon UI */

var deviceId = "C0:98:E5:00:F8:02";                                                 // while testing, replace with address of a BLE peripheral
var deviceName = "E-Ink disp";                                                      // while testing, replace with desired name
var serviceUuid =        "E528A44A-FF4F-3089-D44F-7CB505ABA641";                               // example service UUID to access

var textUuid   = "E528A410-FF4F-3089-D44F-7CB505ABA641";                        // example characteristic UUID to read or write
var xcoordUuid = "E528A411-FF4F-3089-D44F-7CB505ABA641";
var ycoordUuid = "E528A412-FF4F-3089-D44F-7CB505ABA641";
var scaleUuid  = "E528A413-FF4F-3089-D44F-7CB505ABA641";
var qrcodeUuid = "E528A414-FF4F-3089-D44F-7CB505ABA641";

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
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

//write
var wroteSuccessfully = false;

//write buffer
var writeBufferAttempts = 0;
function writeBuffer(charUuid, buffer, device, callback)
{
    if(writeBufferAttempts < 5)
    {
        writeBufferAttempts++;

        ble.writeWithoutResponse(deviceId, serviceUuid, charUuid, buffer, function(){
            console.log("wrote to " + charUuid + " successfully"); 
            wroteSuccessfully = true;

            callback();//:D

        }, function(error){
            console.log("error: " + error);
            if(writeBufferAttempts < 5)
            {
                writeBuffer(charUuid, buffer, device, callback);
            }
        });
    }
}

//write connect
var writeConnectionAttempts = 0;
function writeConnect(charUuid, buffer, device, callback)
{
    if(wroteSuccessfully == false && writeBufferAttempts < 5)
    {
        writeConnectionAttempts++;

        bluetooth.connect(device.id, function(){
            console.log("CONNECTION SUCCESSFUL");

            //convert text to format for write
            var buffer = stringToBytes($("#textinput").val());
            console.log("created buffer");

            console.log("started write");
            writeBuffer(charUuid, buffer, device, callback);

        }, function(error){
            console.log("Connection error: " + error);
            writeConnect(device);
        });
    }
}

//write scanner
var writeScans = 0;
function scanConnectWrite(charUuid, buffer, callback)
{
    if(bluetoothEnabled)
    {
        writeScans++;
        bluetooth.startScan([], function(device){
            if(device.id == deviceId)
            {
                writeConnect(charUuid, buffer, device, callback);
            }
        }, function(error){
            if(writeScans < 5)
            {
                scanConnectWrite();
            }
        });
    }
}

//write x
function writeX(callback)
{
    var buffer = stringToBytes($("#xcoordinateinput").val());
    scanConnectWrite(xcoordUuid, buffer, callback);
}

//write y
function writeY(callback)
{
    var buffer = stringToBytes($("#ycoordinateinput").val());
    scanConnectWrite(ycoordUuid, buffer, callback);
}

//write scale
function writeScale(callback)
{
    var buffer = stringToBytes($("#scaleinput").val());
    scanConnectWrite(scaleUuid, buffer, callback);
}

//write qrcode
function writeQRcode(callback)
{
    var buffer = stringToBytes($("#qrcodeinput").val());
    scanConnectWrite(qrcodeUuid, buffer, callback);
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
                    console.log("Connection error: " + error);
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
    wroteSuccessfully = false;
    bluetooth.isEnabled(app.onEnable);  
    console.log("CLICKED!");

    /*
    for(var i = 0; i < 5; i++)
    {
        if(wroteTextSuccessfully == false)
        {
            writeBLEtext();
        }
    }
    */

    //check if you should write qr code or text
    var qrcodeAddress = $("#qrcodeinput").val();
    if(qrcodeAddress.length > 0)
    {
        writeQRcode(console.log("Successfully wrote qr code"));
    }
    else
    {
        writeX(function(){
            writeY(function(){
                writeScale(function(){
                    writeText(console.log("yay"));
                });
            });
        });
    }
}

app.initialize();