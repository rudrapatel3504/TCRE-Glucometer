#include "Config.h"
#include "PatientRecord.h"
#include "StorageManager.h"
// #include "Protocol.h"
#include "CommandProcessor.h"

void setup()
{
    Serial.begin(SERIAL_BAUDRATE);

    while (!Serial);

    Serial.println();
    Serial.println("--------------------------------");
    Serial.println(DEVICE_NAME);
    Serial.print("Firmware : ");
    Serial.println(FW_VERSION);
    Serial.println("--------------------------------");
    Serial.println("READY");


    StorageManager::begin();
    CommandProcessor::begin();

    // Protocol::ok("BOOT");
    // Protocol::ok("EEPROM READY");
    // Protocol::ok("DEVICE READY");

    Serial.print("Max Records : ");
    Serial.println(StorageManager::getMaxRecords());

    Serial.print("Stored Records : ");
    Serial.println(StorageManager::getRecordCount());
    
}

void loop()
{
    CommandProcessor::process();
}