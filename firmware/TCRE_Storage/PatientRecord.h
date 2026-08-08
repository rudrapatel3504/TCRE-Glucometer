#ifndef PATIENT_RECORD_H
#define PATIENT_RECORD_H

#include <Arduino.h>

struct PatientRecord
{
    uint32_t measurementID;

    uint16_t patientID;

    char name[20];

    uint8_t age;

    char sex;

    uint16_t year;

    uint8_t month;
    uint8_t day;

    uint8_t hour;
    uint8_t minute;
    uint8_t second;

    uint16_t glucose;

    uint8_t active;
};

#endif