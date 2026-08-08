#ifndef DEVICE_HEADER_H
#define DEVICE_HEADER_H

#include <Arduino.h>

struct DeviceHeader
{
    uint16_t magic;

    uint16_t firmwareVersion;

    uint16_t recordCount;

    uint32_t nextMeasurementID;
};

#endif