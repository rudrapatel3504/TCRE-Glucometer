#ifndef CONFIG_H
#define CONFIG_H
#include "DeviceHeader.h"

#define DEVICE_NAME "TCRE Storage Device"
#define FW_VERSION "1.0.0"

#define SERIAL_BAUDRATE 115200

// EEPROM Layout

#define EEPROM_MAGIC 0x5443

#define FIRMWARE_VERSION 100      // v1.00

#define EEPROM_HEADER_ADDR 0

#define EEPROM_DATA_START_ADDR sizeof(DeviceHeader)

// Magic Number
#define EEPROM_MAGIC 0x5443      // "TC"

// Serial Buffer
#define SERIAL_BUFFER_SIZE 128

#endif