#ifndef STORAGE_MANAGER_H
#define STORAGE_MANAGER_H

#include <Arduino.h>
#include "PatientRecord.h"

class StorageManager
{
public:

    static void begin();

    static bool format();

    static bool clear();

    static uint16_t getRecordCount();

    static bool storeRecord(PatientRecord &record);

    static bool readRecord(uint16_t index, PatientRecord &record);

    static bool deleteRecord(uint16_t index);

    static uint16_t getMaxRecords();
};

#endif