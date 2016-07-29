#include <stdbool.h>
#include <stdint.h>

// Nordic libraries
#include "ble_advdata.h"
#include "nordic_common.h"
#include "softdevice_handler.h"

// nrf5x-base libraries
#include "simple_ble.h"
#include "simple_adv.h"
#include "led.h"
#include "device_info_service.h"

#include "eddystone.h"

#include "tcmp441.h"

// Define constants about this beacon.
#define DEVICE_NAME "E-Ink disp"
#define PHYSWEB_URL "goo.gl/pKiLW5"

#define LED0 18
#define LED1 19
#define LED2 20

// Intervals for advertising and connections
static simple_ble_config_t ble_config = {
    .platform_id       = 0x00,              // used as 4th octect in device BLE address
    .device_id         = DEVICE_ID_DEFAULT,
    .adv_name          = DEVICE_NAME,       // used in advertisements if there is room
    .adv_interval      = MSEC_TO_UNITS(500, UNIT_0_625_MS),
    .min_conn_interval = MSEC_TO_UNITS(500, UNIT_1_25_MS),
    .max_conn_interval = MSEC_TO_UNITS(1000, UNIT_1_25_MS)
};

// service and characteristic handles
//  UUID created by `uuidgen -r`
//  16-bit short uuid is 0x890f (bytes 12 and 13 of 128-bit UUID)
static simple_ble_service_t led_service = {
    .uuid128 = {{0x41, 0xa6, 0xab, 0x05, 0xb5, 0x7c, 0x4f, 0xd4,
                 0x89, 0x30, 0x4f, 0xff, 0xa4, 0x4a, 0x28, 0xe5}}
};

//text x coordinate
static simple_ble_char_t text_x_coordinate_char = {.uuid16 = 0xa411};
static uint16_t text_x_coordinate_value = 0;

//text y coordinate
static simple_ble_char_t text_y_coordinate_char = {.uuid16 = 0xa412};
static uint16_t text_y_coordinate_value = 0;

//text scale
static simple_ble_char_t text_scale_char = {.uuid16 = 0xa413};
static uint8_t text_scale_value = 1;//default to 1

//text
static simple_ble_char_t text_char = {.uuid16 = 0xa410};
static char text_value[30] = {0};

//qr code
static simple_ble_char_t qrcode_char = {.uuid16 = 0xa414};
static char qrcode_value[52] = {0};

static volatile uint8_t second=0;

// called automatically by simple_ble_init
void services_init (void) {
    // add led service
    simple_ble_add_service(&led_service);

    //add text x coordinate
    simple_ble_add_characteristic(0, 1, 0, 0,
            2, (uint16_t*)&text_x_coordinate_value,
            &led_service, &text_x_coordinate_char);

    //add text y coordinate
    simple_ble_add_characteristic(0, 1, 0, 0,
            2, (uint16_t*)&text_y_coordinate_value,
            &led_service, &text_y_coordinate_char);

    //add text scale
    simple_ble_add_characteristic(0, 1, 0, 0,
            1, (uint8_t*)&text_scale_value,
            &led_service, &text_scale_char);

    //add string
    simple_ble_add_characteristic(0, 1, 0, 0,
            30, (char*)&text_value,
            &led_service, &text_char);

    //add qr code
    simple_ble_add_characteristic(0, 1, 0, 0,
            52, (char*)&qrcode_value,
            &led_service, &qrcode_char);
}

void ble_evt_write(ble_evt_t* p_ble_evt) 
{
    if (simple_ble_is_char_event(p_ble_evt, &text_char)) 
    {
        tcmp441_writeStringAtLocation(text_value, text_x_coordinate_value, text_y_coordinate_value, text_scale_value);

        tcmp441_updateDisplay();
    }
    else if(simple_ble_is_char_event(p_ble_evt, &qrcode_char))
    {
        tcmp441_writeQRcode(qrcode_value);

        tcmp441_updateDisplay();
    }
}

void ble_evt_connected(ble_evt_t* p_ble_evt)
{
    led_on(LED0);
}

void ble_evt_disconnected(ble_evt_t* p_ble_evt)
{
    led_off(LED0);
}

int main(void) 
{
    //set up the led, spi, and bluetooth
    tcmp441_init(18, 19, 20, 24, 23, 22);

    //write to the screen array and then update the display
    //writeQRcode("http://eecs.umich.edu");
    //updateDisplay();

    simple_ble_init(&ble_config);
    simple_adv_only_name();

    //advertise url
    eddystone_adv(PHYSWEB_URL, NULL);

    //writeStringAtLocation("Booted up", 0, 0, 2);
    //updateDisplay();

    //led_on(LED0);

    tcmp441_clearScreen();
    tcmp441_updateDisplay();

    // Enter main loop.
    while (1) {
        sd_app_evt_wait();
        //power_manage();
    }
}
