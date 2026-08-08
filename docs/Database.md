# Database Design & Cloud Migration Plan

This guide documents the local file-system JSON data model and details the step-by-step database migration to **PostgreSQL**.

---

## 1. Local Database JSON Schema

Currently, data is saved in two JSON files located in the `database/data/` folder:

### `patient_db.json`
Stores the patient identity record and clinical timeseries measurements.
```json
[
  {
    "patientId": "P-88291",
    "name": "Evelyn Harper",
    "age": 54,
    "sex": "Female",
    "measurements": [
      {
        "date": "2026-06-30T08:00:00.000Z",
        "glucose": 95,
        "source": "system",
        "consumedSugarLast6Hours": "NO"
      }
    ],
    "firstMeasurementDate": "2026-06-30T08:00:00.000Z",
    "latestMeasurementDate": "2026-06-30T08:00:00.000Z",
    "latestGlucose": 95,
    "sugarYesCount": 0,
    "sugarNoCount": 1
  }
]
```

### `import_logs.json`
Stores the audit trails for device uploads.
```json
[
  {
    "importDate": "2026-07-30",
    "importTime": "12:00:00",
    "deviceName": "TCRE Device",
    "measurementsImported": 9,
    "duplicatesIgnored": 0,
    "importDuration": "1.2s"
  }
]
```

---

## 2. Cloud Migration PostgreSQL Steps

To support a multi-user, multi-device cloud architecture, migrate the storage layer to a remote database like **AWS RDS PostgreSQL** using **Prisma ORM**.

### Step 1: Install Prisma ORM
Inside the `backend/` directory, install Prisma:
```bash
npm install @prisma/client
npm install -D prisma
```

### Step 2: Initialize Prisma
Create the prisma schema:
```bash
npx prisma init
```
This generates `backend/prisma/schema.prisma`. Configure the file to match the SQL schema defined in [database/schema/tcre_schema.sql](file:///e:/1-Summer%20Internship/Patent%20Frontend/database/schema/tcre_schema.sql):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Patient {
  id                    String        @id @default(uuid()) @db.Uuid
  patientId            String        @unique @map("patient_id")
  name                  String
  age                   Int
  sex                   String
  firstMeasurementDate  DateTime?     @map("first_measurement_date")
  latestMeasurementDate DateTime?     @map("latest_measurement_date")
  latestGlucose         Int           @default(0) @map("latest_glucose")
  sugarYesCount         Int           @default(0) @map("sugar_yes_count")
  sugarNoCount          Int           @default(0) @map("sugar_no_count")
  measurements          Measurement[]
  createdAt             DateTime      @default(now()) @map("created_at")
  updatedAt             DateTime      @updatedAt @map("updated_at")

  @@map("patients")
}

model Measurement {
  id                      String   @id @default(uuid()) @db.Uuid
  patient                 Patient  @relation(fields: [patientUuid], references: [id], onDelete: Cascade)
  patientUuid            String   @map("patient_uuid") @db.Uuid
  date                    DateTime
  glucose                 Int
  source                  String
  medication              String?
  intervention            String?
  consumedSugarLast6Hours String   @default("NO") @map("consumed_sugar_last_6_hours")
  createdAt               DateTime @default(now()) @map("created_at")

  @@unique([patientUuid, date, glucose], name: "idx_measurements_dedup")
  @@map("measurements")
}

model ImportLog {
  id                   Int      @id @default(autoincrement())
  importDate           String   @map("import_date")
  importTime           String   @map("import_time")
  deviceName           String   @map("device_name")
  measurementsImported Int      @map("measurements_imported")
  duplicatesIgnored    Int      @map("duplicates_ignored")
  importDuration       String   @map("import_duration")
  createdAt            DateTime @default(now()) @map("created_at")

  @@map("import_logs")
}
```

### Step 3: Run Database Migrations
Create and apply tables on PostgreSQL:
```bash
npx prisma migrate dev --name init_tcre_tables
```

### Step 4: Refactor `backend/src/lib/db.ts`
Update the database connection code to query Postgres using Prisma:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getPatients() {
  return await prisma.patient.findMany({
    include: { measurements: true }
  });
}
// Rewrite save and delete operations similarly to enforce transactions
```
This decouples the storage mechanism from local JSON database files completely.
