#include <Arduino.h>

#include "CommandProcessor.h"
#include "Protocol.h"
#include "StorageManager.h"
#include "RecordParser.h"
#include "PatientRecord.h"
#include "Config.h"

#define COMMAND_BUFFER_SIZE SERIAL_BUFFER_SIZE

static char commandBuffer[COMMAND_BUFFER_SIZE];
static uint8_t bufferIndex = 0;

static void executeCommand(char *command);

void CommandProcessor::begin()
{
    bufferIndex = 0;
    memset(commandBuffer, 0, sizeof(commandBuffer));
}

void CommandProcessor::process()
{
    while (Serial.available())
    {
        char c = Serial.read();

        if (c == '\r')
            continue;

        if (c == '\n')
        {
            commandBuffer[bufferIndex] = '\0';

            executeCommand(commandBuffer);

            bufferIndex = 0;
            memset(commandBuffer, 0, sizeof(commandBuffer));
        }
        else
        {
            if (bufferIndex < COMMAND_BUFFER_SIZE - 1)
            {
                commandBuffer[bufferIndex++] = c;
            }
        }
    }
}

static void executeCommand(char *command)
{
    // -----------------------------
    // PING
    // -----------------------------
    if (strcmp(command, "PING") == 0)
    {
        Protocol::ok("PONG");
        return;
    }

    // -----------------------------
    // COUNT
    // -----------------------------
    if (strcmp(command, "COUNT") == 0)
    {
        char msg[20];

        sprintf(msg,
                "COUNT,%u",
                StorageManager::getRecordCount());

        Protocol::ok(msg);
        return;
    }

    // -----------------------------
    // CLEAR
    // -----------------------------
    if (strcmp(command, "CLEAR") == 0)
    {
        StorageManager::clear();

        Protocol::ok("CLEARED");
        return;
    }

    // -----------------------------
    // HELP
    // -----------------------------
    if (strcmp(command, "HELP") == 0)
    {
        Protocol::beginBlock("HELP");

        Serial.println("PING");
        Serial.println("COUNT");
        Serial.println("CLEAR");
        Serial.println("STORE");
        Serial.println("GET_DATA");
        Serial.println("INFO");
        Serial.println("FORMAT");

        Protocol::endBlock("HELP");

        return;
    }

    // -----------------------------
    // INFO
    // -----------------------------
    if (strcmp(command, "INFO") == 0)
    {
        char msg[60];
        sprintf(msg,
                "INFO,%s,%s,%u",
                DEVICE_NAME,
                FW_VERSION,
                StorageManager::getMaxRecords());
        Protocol::ok(msg);
        return;
    }

    // -----------------------------
    // STORE
    // -----------------------------
    if (strncmp(command, "STORE,", 6) == 0)
    {
        PatientRecord record;

        if (RecordParser::parseMeasurement(command, record))
        {
            if (StorageManager::storeRecord(record))
            {
                char msg[30];

                sprintf(msg,
                        "STORED,%lu",
                        (unsigned long)record.measurementID);

                Protocol::ok(msg);
            }
            else
            {
                Protocol::error("EEPROM FULL");
            }
        }
        else
        {
            Protocol::error("INVALID RECORD");
        }

        return;
    }

    if (strcmp(command, "GET_DATA") == 0)
  {
    PatientRecord record;

    Protocol::beginBlock("DATA");

    uint16_t count = StorageManager::getRecordCount();

    for (uint16_t i = 0; i < count; i++)
    {
        if (StorageManager::readRecord(i, record))
        {
            Protocol::sendRecord(record);
        }
    }

    Protocol::endBlock("DATA");

    return;
  }

    // -----------------------------
    // UNKNOWN COMMAND
    // -----------------------------
    Protocol::error("UNKNOWN COMMAND");
}