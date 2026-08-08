#include "StorageManager.h"

#include <Arduino.h>
#include <EEPROM.h>

#include "Config.h"
#include "DeviceHeader.h"

static DeviceHeader header;

static void loadHeader()
{
    EEPROM.get(EEPROM_HEADER_ADDR, header);
}

static void saveHeader()
{
    EEPROM.put(EEPROM_HEADER_ADDR, header);
}

void StorageManager::begin()
{
    loadHeader();

    if (header.magic != EEPROM_MAGIC)
    {
        format();
    }
}

bool StorageManager::format()
{
    for (int i = 0; i < EEPROM.length(); i++)
    {
        EEPROM.write(i, 0);
    }

    header.magic = EEPROM_MAGIC;
    header.firmwareVersion = FIRMWARE_VERSION;
    header.recordCount = 0;
    header.nextMeasurementID = 1;

    saveHeader();

    return true;
}

bool StorageManager::clear()
{
    loadHeader();

    header.recordCount = 0;
    header.nextMeasurementID = 1;

    saveHeader();

    return true;
}

uint16_t StorageManager::getRecordCount()
{
    loadHeader();

    return header.recordCount;
}

uint16_t StorageManager::getMaxRecords()
{
    return (EEPROM.length() - EEPROM_DATA_START_ADDR) / sizeof(PatientRecord);
}

bool StorageManager::storeRecord(PatientRecord &record)
{
    loadHeader();

    if (header.recordCount >= getMaxRecords())
    {
        return false;
    }

    record.measurementID = header.nextMeasurementID;

    int address =
        EEPROM_DATA_START_ADDR +
        (header.recordCount * sizeof(PatientRecord));

    EEPROM.put(address, record);

    header.recordCount++;
    header.nextMeasurementID++;

    saveHeader();

    return true;
}

bool StorageManager::readRecord(uint16_t index, PatientRecord &record)
{
    loadHeader();

    if (index >= header.recordCount)
    {
        return false;
    }

    int address =
        EEPROM_DATA_START_ADDR +
        (index * sizeof(PatientRecord));

    EEPROM.get(address, record);

    return true;
}