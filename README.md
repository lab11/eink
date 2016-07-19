# E-Ink
This is a BLE-controlled e-ink display built off of the nrf51822.

## Software
There are 2 main parts to the software for this: the software running on the nrf and the software that makes up the summon app.
The nrf software can be found in the submodule in ``` /software/nrf5x-base/apps/eink-advanced/ ```
The summon app can be found in ``` /software/summon/ ```

## Hardware
The hardware is built on top of the nrf51822. A full parts list can be found in the ``` /hardware ``` directory, along with pcb and case designs.

## API

| Characteristic name | uuid                                 | Data Type                      |
| ------------------- | ------------------------------------ | ------------------------------ |
| service             | e528a44a-ff4f-3089-d44f-7cb505aba641 | None                           | 
| text                | e528a410-ff4f-3089-d44f-7cb505aba641 | 20 byte packets up to 60 bytes |
| x coordinate        | e528a411-ff4f-3089-d44f-7cb505aba641 | uint16_t                       |
| y coordinate        | e528a412-ff4f-3089-d44f-7cb505aba641 | uint16_t                       |
| scale               | e528a413-ff4f-3089-d44f-7cb505aba641 | uint8_t                        |
| qrcode              | e528a414-ff4f-3089-d44f-7cb505aba641 | 20 bytes                       |
| control             | e528a415-ff4f-3089-d44f-7cb505aba641 | uint8_t                        |

#### Text
1. Break your text up into 18-byte packets.
2. Create an array of these packets.
3. For each packet, make the first byte equal to its distance from the last packet (the first byte of the first packet would be chunks.length - 1, the first byte of the last packet will be 0).

#### Control
Writing 1 to control will refresh the display to show changes that have been made.
Writing 2 to control will clear the screen.

