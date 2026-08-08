#include "RecordParser.h"

#include <Arduino.h>
#include <string.h>
#include <stdlib.h>

bool RecordParser::parseMeasurement(const char *command,
                                    PatientRecord &record)
{
    // Make a writable copy because strtok() modifies the string
    char buffer[128];

    strncpy(buffer, command, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';

    char *token = strtok(buffer, ",");

    // First token must be STORE
    if (token == NULL)
        return false;

    if (strcmp(token, "STORE") != 0)
        return false;

    // Patient ID
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    record.patientID = atoi(token);

    // Name
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    strncpy(record.name, token, sizeof(record.name) - 1);
    record.name[sizeof(record.name) - 1] = '\0';

    // Age
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    record.age = atoi(token);

    // Sex
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    record.sex = token[0];

    // Year
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    record.year = atoi(token);

    // Month
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    record.month = atoi(token);

    // Day
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    record.day = atoi(token);

    // Hour
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    record.hour = atoi(token);

    // Minute
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    record.minute = atoi(token);

    // Second
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    record.second = atoi(token);

    // Glucose
    token = strtok(NULL, ",");
    if (token == NULL)
        return false;
    record.glucose = atoi(token);

    record.active = 1;

    return true;
}