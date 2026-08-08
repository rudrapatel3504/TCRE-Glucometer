#ifndef RECORD_PARSER_H
#define RECORD_PARSER_H

#include "PatientRecord.h"

class RecordParser
{
public:

    static bool parseMeasurement(
        const char *command,
        PatientRecord &record);

};

#endif