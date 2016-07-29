PROJECT_NAME = $(shell basename "$(realpath ./)")

APPLICATION_SRCS = $(notdir $(wildcard ./*.c))

APPLICATION_SRCS += softdevice_handler.c
APPLICATION_SRCS += ble_advdata.c
APPLICATION_SRCS += ble_conn_params.c
APPLICATION_SRCS += app_timer.c
APPLICATION_SRCS += app_error.c
APPLICATION_SRCS += app_gpiote.c
APPLICATION_SRCS += led.c

APPLICATION_SRCS += simple_ble.c
APPLICATION_SRCS += simple_adv.c

APPLICATION_SRCS += nrf_drv_spi.c
APPLICATION_SRCS += nrf_drv_common.c
APPLICATION_SRCS += nrf_drv_gpiote.c
APPLICATION_SRCS += nrf_delay.c

APPLICATION_SRCS += eddystone.c

LIBRARY_PATHS += . ../../include
SOURCE_PATHS += ../../src

#NRF BASE PATH!!!
NRF_BASE_PATH ?= ../../nrf5x-base

# include c files for E-Ink display driver
APPLICATION_SRCS += tcmp441.c
APPLICATION_SRCS += $(notdir $(wildcard $(NRF_BASE_PATH)/devices/tcmp441/libqrencode/*.c))



SOFTDEVICE_MODEL = s130
RAM_KB = 32

CFLAGS += -D__STATIC=''
#XXX /\ delete that later
LDFLAGS += --specs=nano.specs

include $(NRF_BASE_PATH)/make/Makefile
