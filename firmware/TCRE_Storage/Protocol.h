#ifndef PROTOCOL_H
#define PROTOCOL_H

#include <Arduino.h>
#include "PatientRecord.h"

class Protocol
{
public:

    static void ok(const String &message);

    static void error(const String &message);

    static void beginBlock(const String &name);

    static void endBlock(const String &name);

    static void sendRecord(const PatientRecord &record);
};

#endif