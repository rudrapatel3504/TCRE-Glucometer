#include "Protocol.h"
#include "PatientRecord.h"

void Protocol::ok(const String &message)
{
    Serial.print("OK,");

    Serial.println(message);
}

void Protocol::error(const String &message)
{
    Serial.print("ERROR,");

    Serial.println(message);
}

void Protocol::beginBlock(const String &name)
{
    Serial.print("BEGIN_");

    Serial.println(name);
}

void Protocol::endBlock(const String &name)
{
    Serial.print("END_");

    Serial.println(name);
}

void Protocol::sendRecord(const PatientRecord &record)
{
    Serial.print(record.measurementID);
    Serial.print(",");

    Serial.print(record.patientID);
    Serial.print(",");

    Serial.print(record.name);
    Serial.print(",");

    Serial.print(record.age);
    Serial.print(",");

    Serial.print(record.sex);
    Serial.print(",");

    Serial.print(record.year);
    Serial.print(",");

    Serial.print(record.month);
    Serial.print(",");

    Serial.print(record.day);
    Serial.print(",");

    Serial.print(record.hour);
    Serial.print(",");

    Serial.print(record.minute);
    Serial.print(",");

    Serial.print(record.second);
    Serial.print(",");

    Serial.println(record.glucose);
}