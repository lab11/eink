# E-Ink
This is a BLE-controlled e-ink display built off of the nrf51822.

## Software
The nrf software can be found in ``` /software/nrf5x-base/apps/eink-advanced/ ```

## Summon App
[Summon](https://github.com/lab11/summon) is a UI application for BLE devices. Rather than requiring every user to install a new app for every BLE device, Summon allows BLE devices to point to their own HTML/JS based interface and loads it in a single application. Eink supports the summon architecture and provides a Summon application.

## Hardware
The hardware is built on top of the nrf51822. A full parts list can be found in the ``` /hardware ``` directory, along with pcb and case designs.

## API

| Characteristic name | uuid                                 | Data Type                      | Range   |
| ------------------- | ------------------------------------ | ------------------------------ | --------
| service             | e528a44a-ff4f-3089-d44f-7cb505aba641 | None                           |         |
| text                | e528a410-ff4f-3089-d44f-7cb505aba641 | 20 byte packets up to 60 bytes |         |
| x coordinate        | e528a411-ff4f-3089-d44f-7cb505aba641 | uint16_t                       | 0 - 400 |
| y coordinate        | e528a412-ff4f-3089-d44f-7cb505aba641 | uint16_t                       | 0 - 300 |
| scale               | e528a413-ff4f-3089-d44f-7cb505aba641 | uint8_t                        | 0 - 10  |
| qrcode              | e528a414-ff4f-3089-d44f-7cb505aba641 | 20 bytes                       |         |
| control             | e528a415-ff4f-3089-d44f-7cb505aba641 | uint8_t                        |         |

#### Text
~~1. Break your text up into 19-byte packets.
2. Create an array of these packets.
3. For each packet, make the first byte equal to its distance from the last packet (the first byte of the first packet would be chunks.length - 1, the first byte of the last packet will be 0).
4. The remaining bytes will be the text packet.~~

**You can only write 18 characters at a time.**

#### Control
Writing 1 to control will refresh the display to show changes that have been made.
Writing 2 to control will clear the screen.

### Example
