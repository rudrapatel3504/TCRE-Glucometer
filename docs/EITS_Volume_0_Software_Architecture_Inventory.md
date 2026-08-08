# TEMPORAL CLINICAL REASONING ENGINE (TCRE)
# ENGINEERING INVENTION TECHNICAL SPECIFICATION (EITS)
# VOLUME 0 – SYSTEM ARCHITECTURE SPECIFICATION

---

## DOCUMENT METADATA SHEET

*   **Document Title:** EITS Volume 0 – System Architecture Specification
*   **Document Type:** Engineering Architecture Specification
*   **Document Version:** 2.1 (Frozen Master Reference)
*   **Software Version:** 2.1.0
*   **Revision Number:** 1.0.0
*   **Status:** Approved / Frozen
*   **Classification:** Restrictive / Clinical Engineering Internal
*   **Prepared By:** Lead Medical Systems Engineer
*   **Prepared Date:** 2026-06-21
*   **Review Status:** Reviewed & Verified by Senior Systems Architect
*   **Approval Status:** Formally Approved by Clinical Safety Officer
*   **Associated Repository:** `tcre-frontend`
*   **Associated Software Version:** 2.1.0
*   **Document Owner:** Clinical Safety Board
*   **Document Scope:** Software architecture inventory, algorithms, state rules, and validator verification.

---

## 0. TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)  
   1.1 [Project Name & Identification](#11-project-name--identification)  
   1.2 [Purpose & Scope](#12-purpose--scope)  
   1.3 [Primary Technical Objectives](#13-primary-technical-objectives)  
   1.4 [Current Implementation Status](#14-current-implementation-status)  
   1.5 [Software Technology Stack](#15-software-technology-stack)  
   1.6 [High-Level Architectural Model](#16-high-level-architectural-model)  
   1.7 [Engineering Design Principles](#17-engineering-design-principles)  
2. [System Context](#2-system-context)  
   2.1 [Clinical Workflow Integration](#21-clinical-workflow-integration)  
   2.2 [Clinical Reasoning Engine Definition](#22-clinical-reasoning-engine-definition)  
3. [System Boundary Definition](#3-system-boundary-definition)  
   3.1 [Inside TCRE Boundary](#31-inside-tcre-boundary)  
   3.2 [Outside TCRE Boundary](#32-outside-tcre-boundary)  
4. [Functional Requirements](#4-functional-requirements)  
   4.1 [Telemetry Ingestion Requirements](#41-telemetry-ingestion-requirements)  
   4.2 [Calculation & Metric Engine Requirements](#42-calculation--metric-engine-requirements)  
   4.3 [Latent & Composite State Requirements](#43-latent--composite-state-requirements)  
   4.4 [Risk & Recommendation Requirements](#44-risk--recommendation-requirements)  
   4.5 [Prediction & Simulation Requirements](#45-prediction--simulation-requirements)  
   4.6 [Validation & Auditing Requirements](#46-validation--auditing-requirements)  
5. [Non-Functional Requirements](#5-non-functional-requirements)  
   5.1 [Performance & Latency](#51-performance--latency)  
   5.2 [Determinism & Repeatability](#52-determinism--repeatability)  
   5.3 [Explainability & Traceability](#53-explainability--traceability)  
   5.4 [Reliability & Availability](#54-reliability--availability)  
   5.5 [Maintainability & Extensibility](#55-maintainability--extensibility)  
   5.6 [Auditability & Compliance](#56-auditability--compliance)  
   5.7 [Scalability & Portability](#57-scalability--portability)  
   5.8 [Security Assumptions](#58-security-assumptions)  
   5.9 [Usability & Safety](#59-usability--safety)  
6. [Engineering Assumptions](#6-engineering-assumptions)  
   6.1 [Data Completeness & Quality Assumptions](#61-data-completeness--quality-assumptions)  
   6.2 [Physiological & Calibration Assumptions](#62-physiological--calibration-assumptions)  
7. [External Interfaces](#7-external-interfaces)  
   7.1 [Input Interfaces](#71-input-interfaces)  
   7.2 [Output Interfaces](#72-output-interfaces)  
8. [Operating Modes](#8-operating-modes)  
   8.1 [Modes Specification](#81-modes-specification)  
9. [Error States & Recovery Actions](#9-error-states--recovery-actions)  
   9.1 [Error Catalog](#91-error-catalog)  
10. [System Sequence Diagram](#10-system-sequence-diagram)  
    10.1 [Reasoning Cycle Transitions](#101-reasoning-cycle-transitions)  
11. [Data Lifecycle](#11-data-lifecycle)  
    11.1 [Telemetry Lifecycle States](#111-telemetry-lifecycle-states)  
12. [Current System Capabilities](#12-current-system-capabilities)  
    12.1 [Capability Matrix](#121-capability-matrix)  
13. [Project Statistics](#13-project-statistics)  
    13.1 [Engineering Summary](#131-engineering-summary)  
14. [Engineering Maturity Assessment](#14-engineering-maturity-assessment)  
    14.1 [Maturity Metrics](#141-maturity-metrics)  
15. [Current System Limitations](#15-current-system-limitations)  
    15.1 [Technical Limitations](#151-technical-limitations)  
16. [Engineering Design Rationale](#16-engineering-design-rationale)  
    16.1 [Rationale Specifications](#161-rationale-specifications)  
17. [Verification Summary](#17-verification-summary)  
    17.1 [Verification Activities](#171-verification-activities)  
18. [Document Version History](#18-document-version-history)  
    18.1 [Major Development Milestones](#181-major-development-milestones)  
19. [Repository Inventory](#19-repository-inventory)  
    19.1 [Directory Hierarchy Tree](#191-directory-hierarchy-tree)  
    19.2 [Configuration Files & Build System](#192-configuration-files--build-system)  
    19.3 [Dependencies & Versions](#193-dependencies--versions)  
20. [Module Inventory](#20-module-inventory)  
    20.1 [Core Modules List](#201-core-modules-list)  
    20.2 [Zustand Store Module](#202-zustand-store-module)  
    20.3 [Core API & Calculation Module](#203-core-api--calculation-module)  
    20.4 [Clinical Rule Validator Module](#204-clinical-rule-validator-module)  
    20.5 [Prediction & Simulation Engine Module](#205-prediction--simulation-engine-module)  
    20.6 [Scenario Definitions Module](#206-scenario-definitions-module)  
21. [Frontend Inventory](#21-frontend-inventory)  
    21.1 [Root Page & Dashboard Components](#211-root-page-&-dashboard-components)  
22. [Technology Decision Record (TDR)](#22-technology-decision-record-tdr)  
    22.1 [Technology Selection and Trade-off Matrix](#221-technology-selection-and-trade-off-matrix)  
23. [Software Engineering Standards](#23-software-engineering-standards)  
    23.1 [Folder Organization & Architecture Philosophy](#231-folder-organization--architecture-philosophy)  
    23.2 [Component Naming & File Organization Rules](#232-component-naming--file-organization-rules)  
    23.3 [State Management & Interface Naming Conventions](#233-state-management--interface-naming-conventions)  
    23.4 [TypeScript, React, & Dependency Policies](#234-typescript-react--dependency-policies)  
    23.5 [Modularity, Separation of Concerns, & Error Handling](#235-modularity-separation-of-concerns--error-handling)  
    23.6 [Clinical Validation Philosophy](#236-clinical-validation-philosophy)  
24. [Implementation Status & Subsystem Testing Matrix](#24-implementation-status--subsystem-testing-matrix)  
    24.1 [Subsystem Matrix Grid](#241-subsystem-matrix-grid)  
25. [Backend Inventory](#25-backend-inventory)  
    25.1 [REST API Design](#251-rest-api-design)  
    25.2 [Client-Side Fallback Execution Architecture](#252-client-side-fallback-execution-architecture)  
    25.3 [Asynchronous Telemetry Emulation](#253-asynchronous-telemetry-emulation)  
26. [Data Flow Inventory](#26-data-flow-inventory)  
    26.1 [Step-by-Step Chronological Pipeline](#261-step-by-step-chronological-pipeline)  
    26.2 [Layer Interfaces & Next Processing Destination](#262-layer-interfaces--next-processing-destination)  
27. [Mathematical Inventory](#27-mathematical-inventory)  
    27.1 [Decoupled Trend-Independent Volatility (RMSE)](#271-decoupled-trend-independent-volatility-rmse)  
    27.2 [Velocity Index (VI)](#272-velocity-index-vi)  
    27.3 [Acceleration Index (AI)](#273-acceleration-index-ai)  
    27.4 [Baseline Deviation Index (BDI)](#274-baseline-deviation-index-bdi)  
    27.5 [Cumulative Burden Index (CBI)](#275-cumulative-burden-index-cbi)  
    27.6 [State Confidence Index (SCI)](#276-state-confidence-index-sci)  
    27.7 [Calibrated Dynamic Confidence Labeling](#277-calibrated-dynamic-confidence-labeling)  
    27.8 [Synthetic Risk Score Formulation](#278-synthetic-risk-score-formulation)  
    27.9 [Digital Twin Overall Score Weightings](#279-digital-twin-overall-score-weightings)  
28. [Clinical Rule Inventory](#28-clinical-rule-inventory)  
    28.1 [Fasting Target Ranges](#281-fasting-target-ranges)  
    28.2 [Latent State Activation Rules](#282-latent-state-activation-rules)  
    28.3 [Latent State Lifecycle Evolution Rules](#283-latent-state-lifecycle-evolution-rules)  
    28.4 [Composite State Gating & Activation Rules](#284-composite-state-gating--activation-rules)  
    28.5 [Synthesized Risk Tier Mapping Rules](#285-synthesized-risk-tier-mapping-rules)  
    28.6 [Risk Trend Engine Rules](#286-risk-trend-engine-rules)  
    28.7 [Clinician Recommendation Selection Logic](#287-clinician-recommendation-selection-logic)  
    28.8 [Urgent Action Overrides (Critical Risk Tier)](#288-urgent-action-overrides-critical-risk-tier)  
29. [State Inventory](#29-state-inventory)  
    29.1 [Glycemic Metrics States](#291-glycemic-metrics-states)  
    29.2 [Latent Clinical States](#292-latent-clinical-states)  
    29.3 [Composite Crisis States](#293-composite-crisis-states)  
    29.4 [Risk Classification States](#294-risk-classification-states)  
    29.5 [Clinician Recommendation Classes](#295-clinician-recommendation-classes)  
30. [Algorithm Inventory](#30-algorithm-inventory)  
    30.1 [Least Squares Linear Regression Slope Fit](#301-least-squares-linear-regression-slope-fit)  
    30.2 [Markov Trajectory Probability Allocation](#302-markov-trajectory-probability-allocation)  
    30.3 [Digital Twin Scenario Modeling & Multipliers](#303-digital-twin-scenario-modeling--multipliers)  
    30.4 [Validation Engine Compliance Grading](#304-validation-engine-compliance-grading)  
31. [Explainability Inventory](#31-explainability-inventory)  
    31.1 [Dynamic Clinical Narrative Summarizer](#311-dynamic-clinical-narrative-summarizer)  
    31.2 [Intermediate Calculation & Gating Traceability](#312-intermediate-calculation--gating-traceability)  
    31.3 [Telemetry Gaps & Limitations Logger](#313-telemetry-gaps--limitations-logger)  
32. [Digital Twin Inventory](#32-digital-twin-inventory)  
    32.1 [Intervention Scenarios](#321-intervention-scenarios)  
    32.2 [Scenario Evaluation & Ranking System](#322-scenario-evaluation--ranking-system)  
33. [Validation Inventory](#33-validation-inventory)  
    33.1 [Eight-Layer Consistency Check Structure](#331-eight-layer-consistency-check-structure)  
    33.2 [Validation Severity Outputs](#332-validation-severity-outputs)  
    33.3 [Automated Stress Testing System](#333-automated-stress-testing-system)  
34. [API Inventory](#34-api-inventory)  
    34.1 [Endpoint Specification](#341-endpoint-specification)  
    34.2 [Offline Fallback Processing Handler](#342-offline-fallback-processing-handler)  
35. [Data Model Inventory](#35-data-model-inventory)  
    35.1 [Zustand Store State & Action Schema](#351-zustand-store-state--action-schema)  
    35.2 [Logic Module Interface Schemas](#352-logic-module-interface-schemas)  
36. [Dependency Graph](#36-dependency-graph)  
    36.1 [Textual Module Interdependency Diagram](#361-textual-module-interdependency-diagram)  
37. [Future Architecture Roadmap](#37-future-architecture-roadmap)  
    37.1 [Biomarker and Deployment Extensibility Roadmap](#371-biomarker-and-deployment-extensibility-roadmap)  
38. [Appendix A: Complete Glossary of Abbreviations](#38-appendix-a-complete-glossary-of-abbreviations)  
39. [Appendix B: Documentation Gap Analysis](#39-appendix-b-documentation-gap-analysis)  
    39.1 [Subsystem Documentation Status & Priority Grid](#391-subsystem-documentation-status-&-priority-grid)  

### LIST OF FIGURES
*   **Figure 1.1:** TCRE High-Level Three-Tier Component Architecture  
*   **Figure 2.1:** Clinical Workflow System Context Diagram  
*   **Figure 10.1:** Chronological Telemetry Ingestion Sequence Diagram  
*   **Figure 11.1:** Telemetry Data Ingestion and Processing Lifecycle  
*   **Figure 26.1:** 10-Stage Chronological Data Processing Pipeline Flow  
*   **Figure 33.1:** 8-Layer Clinical Rule Validator and Stress Test Loop  
*   **Figure 36.1:** Code Module Coupling and Interdependency Graph  
*   **Figure 37.1:** Extensible Biomarker Reasoning & Deployment Roadmap  

### LIST OF TABLES
*   **Table 1.1:** TCRE Software Stack Components  
*   **Table 8.1:** Operating Modes Specifications Matrix  
*   **Table 9.1:** Ingestion and Calculation Error Handler Catalog  
*   **Table 12.1:** Clinical Capabilities Verification Matrix  
*   **Table 17.1:** Verification Activities Status Summary  
*   **Table 18.1:** Software Release and Milestone History  
*   **Table 19.1:** Main Package Configurations and Build Scripts  
*   **Table 19.2:** NPM Production and Development Dependencies  
*   **Table 20.1:** Core TS/JSX Logic Modules  
*   **Table 21.1:** Frontend Layout Dashboard Components  
*   **Table 22.1:** Technology Selection and Trade-off Matrix  
*   **Table 24.1:** Subsystem Implementation & Validation Matrix  
*   **Table 26.1:** Digital Twin Simulation Multiplier Scenarios  
*   **Table 28.1:** Metric Score and Trend Calibration Thresholds  
*   **Table 28.2:** Latent State Gating and Algebraic Formulas  
*   **Table 28.3:** Composite State Activation Gates and Logic Rules  
*   **Table 28.4:** Risk Score Tier Mapping Ranges  
*   **Table 29.1:** Latent State Identifiers and Clinical Roles  
*   **Table 29.2:** Composite State Identifiers and Criteria  
*   **Table 35.1:** Zustand Store Interface Action List  
*   **Table 39.1:** Architectural Documentation Gap Analysis Grid  

---

## 1. PROJECT OVERVIEW

### 1.1 Project Name & Identification
The system documented in this technical specification is the **Temporal Clinical Reasoning Engine (TCRE)**, specifically under system version **2.1.0 (Frozen Release Candidate)**. The corresponding React code project is identified as `tcre-frontend`.

### 1.2 Purpose & Scope
TCRE is a deterministic clinical reasoning engine designed to process patient physiological biomarker telemetry, calculate clinical indices, extract latent disease state trends, synthesize composite crisis conditions, and generate explainable clinician-facing recommendations and digital twin simulations. The scope is limited strictly to the existing logic implemented in the client-side Zustand store, calculation helper modules, validation engine, and frontend component layout.

### 1.3 Primary Technical Objectives
*   **Real-time Telemetry Parsing:** Parse physiological biomarker values from CSV uploads or manual inputs. *(Current embodiment uses fasting blood glucose.)*
*   **Clinical Index Quantification:** Compute velocity, acceleration, baseline deviation, cumulative burden, volatility, and state data confidence.
*   **Latent State Classification:** Evaluate eight distinct clinical indicators using met/unmet Boolean gates.
*   **Composite Crisis Synthesis:** Model complex multi-state interactions such as Emerging Crisis and Hidden Escalation.
*   **Intelligent Logic Validation:** Audit all mathematical and reasoning chains across an 8-layer validator to detect structural logic violations.
*   **Explainable Forecasting:** Emulate dynamic Markov trajectories and rank digital twin scenarios based on metric multipliers.

### 1.4 Current Implementation Status
*   **Client Core (v2.1):** 100% Implemented. All indices, latent rules, composite states, risk tiering, digital twin scenario matrices, and compliance validation reports run client-side.
*   **FastAPI Backend Connectivity:** Client contains REST API routes prepared for backend servers; features a high-fidelity local client fallback when the server is offline.
*   **Future Modules (v3):** Visual placeholders for trajectory charting and digital twin controls in `src/components/FutureEnginePlaceholders.tsx` are unreferenced in page layouts. Actual processing is handled by active v2 modules.

### 1.5 Software Technology Stack
The software stack utilized in this workspace is detailed in Table 1.1.

| Component | Framework / Library | Version | Role in Architecture |
| :--- | :--- | :--- | :--- |
| **App Framework** | Next.js | `16.2.9` | Page routing, metadata handling, layout structure. |
| **Logic & State** | React / Zustand | `19.2.4` / `5.0.14` | Component lifecycle hooks and centralized global state store. |
| **Language** | TypeScript | `^5` | Strict static typing for clinical interfaces and modules. |
| **Data Visuals** | Recharts | `^3.8.1` | Renders the primary time-series glucose chart. |
| **Icons** | Lucide React | `^1.17.0` | Provides clinical symbols and dashboard action indicators. |
| **Export Engines**| jspdf / html2canvas-pro | `4.2.1` / `2.0.4` | Translates DOM dashboard layers to clinical PDF reports. |
| **Styles** | TailwindCSS | `^4` | Renders vanilla CSS classes, variables, and dark-mode tokens. |

*Table 1.1: TCRE Software Stack Components*

### 1.6 High-Level Architectural Model
The engine operates on a three-tier design as depicted in Figure 1.1:

```
+-------------------------------------------------------------+
|                     1. DATA ENTRY LAYER                     |
|    (CSV File Uploader / Mock Scenario Loader / Manual Form) |
+------------------------------+------------------------------+
                               |
                               v (Sorted Measurements Array)
+------------------------------+------------------------------+
|                   2. CLINICAL REASONING CORE                |
|  (api.ts / predictionEngine.ts / clinicalRuleValidator.ts)  |
+------------------------------+------------------------------+
                               |
                               v (AnalysisResult Object & Validation Report)
+------------------------------+------------------------------+
|                     3. PRESENTATION LAYER                   |
|      (Next.js React Dashboard / Recharts Visualizations)    |
+-------------------------------------------------------------+
```
*Figure 1.1: TCRE High-Level Three-Tier Component Architecture*

### 1.7 Engineering Design Principles
The core architecture of the TCRE is defined by fifteen structural design philosophies. These guidelines dictate how data flows, how logic gates are processed, and how the frontend interacts with core reasoning structures:
1.  **Deterministic Reasoning:** For any given array of sorted telemetry input, the engine must return identical indices, latent states, and risk outputs. All statistical formulas exclude non-deterministic runtime functions.
2.  **Explainability-First Design:** Audit logs, limit values, intermediate calculations, and clinical narratives are computed inline alongside primary indexes. Raw parameters are transparently mapped to clinical reasons.
3.  **Layer Isolation:** No frontend layout controls or styling classes are imported into calculation files. Metric, latent, composite, and risk calculations reside strictly in separate execution scopes.
4.  **Modular Clinical Architecture:** Latent state gates and composite formulas are decoupled into independent functional units, facilitating the adding of new parameters without modifications to base classes.
5.  **Separation of UI and Reasoning:** The React dashboard reads from a read-only compiled Zustand analysis state, ensuring calculations are completed before rendering components.
6.  **Biomarker Independence:** Calculations and logic checks are designed to map general physiological telemetry values (e.g. rate-of-change, variance, cumulative thresholds) without hard-coding biomarker specific variables. *(Current embodiment uses fasting blood glucose.)*
7.  **Rule-Based Transparency:** The clinical validator utilizes explicit, open Boolean gates instead of black-box inference, enabling tracing of each decision path.
8.  **Offline-First Computation:** Calculation files run entirely client-side, using local functions as a fallback if the REST API server goes offline.
9.  **Validation-Driven Development:** The engine runs live compliance validation audits against the 8-layer validator, blocking release flags if logic errors exceed 5%.
10. **Extensible Subsystem Architecture:** Modules are coupled via strict TypeScript interfaces, permitting replacement of prediction engines or simulator loops.
11. **Reproducibility:** A deterministic pseudo-random generator is used to simulate mock scenario values, ensuring reproducible stress test runs.
12. **Traceability:** State timeline configurations and clinician reports include intermediate calculation traces, mapping decisions back to raw measurements.
13. **Maintainability:** Standard folder layouts separate layout layers, logic modules, and configuration libraries.
14. **Testability:** Telemetry scenarios verify the functionality of logic gates under varying ranges (e.g. volatile vs. stable profiles).
15. **Scalability:** The pipeline allows multi-day scaling (7 to 90 days) without modifications to math utilities.

---

## 2. SYSTEM CONTEXT

### 2.1 Clinical Workflow Integration
The TCRE functions as an autonomous, secondary reasoning pipeline inside clinical monitoring networks. It sits between telemetry collection devices and clinician decision layouts, processing raw metrics to highlight high-order risks as shown in Figure 2.1:

```
  [Patient]
      │
      ▼ (Biomarker Exudation)
  [Measurement Device]
      │
      ▼ (Telemetry Capture)
  [CSV Upload / Manual Entry]
      │
      ▼ (Sorted Telemetry Input)
  [TCRE reasoning engine]
      │
      ├─► [Temporal Metrics Indexing]
      │        │
      │        ▼
      ├─► [Latent State Detection]
      │        │
      │        ▼
      ├─► [Composite State Synthesis]
      │        │
      │        ▼
      ├─► [Risk Assessment Engine]
      │        │
      │        ▼
      ├─► [Recommendation Generator]
      │        │
      │        ▼
      └─► [Digital Twin Simulation]
               │
               ▼ (Analysis Result & Simulated Forecasts)
  [Clinician Decision Interface]
      │
      ▼ (Expert Review)
  [Clinical Decision & Action]
```
*Figure 2.1: Clinical Workflow System Context Diagram*

*   **Patient:** The clinical subject under telemetry observation, exhibiting measurable physiological values.
*   **Measurement Device:** Hardware sensors (e.g. self-monitoring devices, wearable instruments) that capture physiological parameters.
*   **CSV Upload / Manual Entry:** Ingestion methods that format raw sensor readings into structured arrays.
*   **TCRE Reasoning Engine:** The clinical reasoning engine that processes raw telemetry data through its calculations, latent gates, and composite engines.
*   **Temporal Metrics:** The six primary clinical indices computed from raw time-series values.
*   **Latent States:** Underling clinical conditions evaluated via Boolean gate sets.
*   **Composite States:** Multi-state crisis profiles synthesized via coupling interaction models.
*   **Risk Assessment:** Dynamic classification of patient risk tiers and trends.
*   **Clinical Recommendations:** Actionable guidelines mapped to risk severity.
*   **Digital Twin Simulation:** Extrapolations of telemetry profiles under different modifier scenarios.
*   **Clinician:** The expert reviewer who audits the engine's outputs.
*   **Clinical Decision:** The final action taken by the clinician based on the engine's analysis.

### 2.2 Clinical Reasoning Engine Definition
The TCRE is strictly a **clinical reasoning engine** rather than an autonomous medical diagnostic device. It acts as an advisory logic tool, parsing telemetry and exposing its decision chains to clinicians. The engine does not directly issue treatment scripts, alter device parameters, or diagnose specific diseases. The clinician retains full diagnostic and therapeutic responsibility.

---

## 3. SYSTEM BOUNDARY DEFINITION

### 3.1 Inside TCRE Boundary
The software boundary of TCRE encloses all core telemetry processing, mathematical auditing, and forecasting calculations. The following functional modules run within this boundary:
*   **Telemetry Ingestion:** Validating, filtering, and parsing uploaded CSV text files or manual forms.
*   **Metric Computation:** Calculating baseline deviations, velocity, volatility, and acceleration metrics.
*   **Temporal Reasoning:** Fitting linear regression lines to identify baseline drift and rate-of-change trajectories.
*   **Latent State Detection:** Processing Boolean logic gates to evaluate clinical indicators.
*   **Composite State Synthesis:** Evaluating interaction strengths and persistence days to identify composite crisis profiles.
*   **Risk Assessment:** Tiering dynamic risk scores and trends based on weighted metric values.
*   **Recommendation Engine:** Selecting and prioritizing clinician guidelines.
*   **Explainability Engine:** Compiling narrative summaries, calculations, and active gate audits.
*   **Digital Twin Simulation:** Modeling the patient's physiology under metric multipliers.
*   **Validation Engine:** Auditing the mathematical and logical consistency of all reasoning chains.

### 3.2 Outside TCRE Boundary
The following systems, devices, and clinical workflows exist outside the boundaries of TCRE:
*   **Laboratory Instruments:** Physical telemetry hardware, sensors, and monitors.
*   **Hospital Information Systems (HIS) & EHR Databases:** Remote clinical database servers and patient records.
*   **Medical Diagnosis:** The final clinical diagnosis of a patient's medical condition.
*   **Drug Prescription:** Issuing medication scripts or adjusting therapy plans.
*   **Treatment Execution:** Administering medications or delivering therapies.
*   **Clinician Judgement:** The final review and assessment of the engine's findings by the clinician.
*   **Patient Behaviour:** The patient's adherence to diets, exercise regimens, or medication plans.

---

## 4. FUNCTIONAL REQUIREMENTS

This section specifies the functional requirements of the TCRE system version 2.1.

### 4.1 Telemetry Ingestion Requirements
*   **FR-001:** The system shall ingest time-series arrays of physiological biomarker measurements. *(Current embodiment uses fasting blood glucose.)*
*   **FR-002:** The system shall validate that glucose readings fall within the range of 50 to 600 mg/dL.
*   **FR-003:** The system shall support uploading telemetry records via structured CSV files.
*   **FR-004:** The system shall support manual entry of single telemetry measurements.
*   **FR-005:** The system shall sort ingested measurements chronologically by timestamp.

### 4.2 Calculation & Metric Engine Requirements
*   **FR-006:** The system shall calculate the mean biomarker value over the selected observation window.
*   **FR-007:** The system shall calculate the Velocity Index (VI) using the slope of linear regression over daily averages.
*   **FR-008:** The system shall calculate the Volatility Index (VOL) using Root Mean Square Error (RMSE) residuals.
*   **FR-009:** The system shall calculate the Baseline Deviation Index (BDI) relative to a target value of 110 mg/dL.
*   **FR-010:** The system shall calculate the Cumulative Burden Index (CBI) for glucose values exceeding 140 mg/dL.
*   **FR-011:** The system shall calculate the State Confidence Index (SCI) based on telemetry completeness.

### 4.3 Latent & Composite State Requirements
*   **FR-012:** The system shall evaluate eight latent clinical states using Boolean activation gates.
*   **FR-013:** The system shall assign a severity level (Normal, Moderate, High, Severe) to each latent state.
*   **FR-014:** The system shall evaluate the lifecycle status (Emerging, Active, Resolved, etc.) of each latent state.
*   **FR-015:** The system shall synthesize composite crisis states by evaluating interaction strengths and persistence days.

### 4.4 Risk & Recommendation Requirements
*   **FR-016:** The system shall compute a synthetic risk score by combining volatility, latent states, and active composite states.
*   **FR-017:** The system shall map the risk score to risk tiers (Minimal, Low, Moderate, High, Critical).
*   **FR-018:** The system shall select clinician recommendations matching the active composite states and risk tier.
*   **FR-019:** The system shall prepend urgent recommendations if the patient's risk tier is Critical.

### 4.5 Prediction & Simulation Requirements
*   **FR-020:** The system shall allocate transition probabilities for Decline, Maintenance, and Recovery pathways.
*   **FR-021:** The system shall generate future recommendation forecasts for 3-day, 7-day, and 30-day timeframes.
*   **FR-022:** The system shall simulate patient parameters under four Digital Twin intervention scenarios.
*   **FR-023:** The system shall rank the simulated intervention scenarios using a weighted utility score.

### 4.6 Validation & Auditing Requirements
*   **FR-024:** The system shall audit reasoning chains across an 8-layer validator to detect logic errors.
*   **FR-025:** The system shall compile intermediate calculations, active gates, and telemetry limitations for the explainability explorer.
*   **FR-026:** The system shall compile a report containing compliance scores, warning lists, error lists, and audit logs.
*   **FR-027:** The system shall support exporting the clinical reasoning pathway layout to a PDF report.

---

## 5. NON-FUNCTIONAL REQUIREMENTS

This section specifies the non-functional requirements of the TCRE system version 2.1.

### 5.1 Performance & Latency
*   **Requirement:** The engine must process a 30-day telemetry profile (90 readings) and run all calculations within 50ms.
*   **Rationale:** Low processing times prevent UI latency, ensuring an interactive user experience when switching observation windows or scenarios.

### 5.2 Determinism & Repeatability
*   **Requirement:** For any given array of sorted telemetry input, TCRE must return identical calculation outputs.
*   **Rationale:** Deterministic calculations are essential to verify rule consistency and support regulatory submissions.

### 5.3 Explainability & Traceability
*   **Requirement:** The engine must expose all intermediate calculations, active gates, and evidence narratives.
*   **Rationale:** Clear traceability allows clinicians to audit how clinical indices and risk tiers are computed, building trust in the system.

### 5.4 Reliability & Availability
*   **Requirement:** Calculation modules must run offline, falling back to local client-side processing if backend servers are offline.
*   **Rationale:** Standalone execution guarantees availability in clinical environments with unreliable network connections.

### 5.5 Maintainability & Extensibility
*   **Requirement:** Logic files must be isolated from React components, and subsystems must be coupled via strict TypeScript interfaces.
*   **Rationale:** Separation of concerns simplifies updates to clinical rules and supports adding new biomarkers without modifying base classes.

### 5.6 Auditability & Compliance
*   **Requirement:** The 8-layer validator must check all reasoning outputs, logging warnings and errors in the audit trail.
*   **Rationale:** Real-time logic verification ensures compliance with clinical rules and flags potential consistency issues.

### 5.7 Scalability & Portability
*   **Requirement:** The system must run on standard browsers without requiring dedicated database configurations.
*   **Rationale:** Lightweight, client-side execution allows the engine to be integrated into diverse clinical environments.

### 5.8 Security Assumptions
*   **Requirement:** The application assumes deployment within a secure intranet or sandbox, leaving user authentication to parent systems.
*   **Rationale:** Delegating security to the hosting network simplifies implementation while protecting patient data.

### 5.9 Usability & Safety
*   **Requirement:** The interface must use color-coded badges to represent severity levels and provide descriptive tooltips for clinical indices.
*   **Rationale:** Clear visual indicators reduce the risk of misinterpretation, supporting safe clinical decisions.

---

## 6. ENGINEERING ASSUMPTIONS

This section documents the assumptions made by TCRE. These variables define the expected state of inputs, units, and ranges.

### 6.1 Data Completeness & Quality Assumptions
*   **Chronological Order:** Ingested measurements are assumed to be sorted by timestamp. The engine automatically sorts values during import to ensure chronological consistency.
*   **Consistent Units:** Input values must use the same units throughout the observation window. The user interface handles conversions between mg/dL and mmol/L.
*   **Accurate Timestamps:** Measurements are assumed to contain valid timestamps to calculate day numbers and observation spans.
*   **Minimum Observation Period:** The engine assumes a minimum observation window of 5 days to calculate short-term trends.
*   **No Duplicated Records:** The ingestion pipeline assumes duplicate measurements have been filtered out before calculations begin.
*   **Telemetry Density:** Calculations assume at least three daily measurements. Sparse data triggers warnings in the explainability log.

### 6.2 Physiological & Calibration Assumptions
*   **Fasting Biomarker Input:** The current version assumes input measurements represent fasting biomarker values. *(Current embodiment uses fasting blood glucose.)*
*   **Fixed Baseline Target:** Baseline deviation calculations are relative to a target of 110 mg/dL.
*   **Rule Calibration:** Gating thresholds and severity brackets are calibrated for blood glucose. Using other biomarkers requires recalibrating these parameters.
*   **Linear Trends:** Short-term trend calculations assume a linear relationship over a rolling 5-day window.

---

## 7. EXTERNAL INTERFACES

### 7.1 Input Interfaces
*   **CSV File Ingestion:** Processes text files containing date, time, and biomarker readings. Values must be comma-separated, with dates formatted in ISO standard.
*   **Manual Entry Form:** An interactive form with input fields for date, time, and biomarker value.
*   **REST API Payload:** A JSON payload containing a `measurements` array and a `window_days` parameter.
*   **Scenario Loader:** A component that seeds the engine with telemetry data from one of the 10 predefined clinical profiles.

### 7.2 Output Interfaces
*   **Interactive Dashboard:** Displays charts, metrics cards, latent grids, and risk gauges.
*   **Clinician Recommendations:** Displays prioritized guidelines grouped by clinical urgency.
*   **Explainability Panel:** Displays formulas, intermediate calculations, and active gates.
*   **PDF Report Export:** Generates a downloadable PDF report containing the clinical reasoning pathway layout.
*   **Validation Report:** Displays compliance scores, warnings, errors, and audit logs.

---

## 8. OPERATING MODES

TCRE version 2.1 operates in the modes detailed in Table 8.1.

| Operating Mode | Purpose | Primary Inputs | Primary Outputs | Expected User |
| :--- | :--- | :--- | :--- | :--- |
| **Manual Input** | Manual entry of single readings. | Form values | Updated analysis, updated timeline | Clinician / Nurse |
| **CSV Upload** | Batch upload of historical data. | CSV file | Updated analysis, updated timeline | Clinician / Researcher |
| **Scenario Testing** | Seeding predefined patient profiles. | Scenario ID | Telemetry, validation report | Developer / Auditor |
| **Patent Validation** | Live auditing of clinical rules. | Analysis results | Compliance status, logic warnings | Developer / Auditor |
| **Explainability** | Tracing formulas and logic gates. | Selected metric/state | Formulas, met/unmet gates | Clinician / Auditor |
| **Digital Twin** | Simulating intervention scenarios. | Multipliers | Utility scores, ranked scenarios | Clinician |
| **Stress Test** | Run validation on all 10 profiles. | Store trigger | Stress test summary, release status | Developer / Auditor |

*Table 8.1: Operating Modes Specifications Matrix*

---

## 9. ERROR STATES & RECOVERY ACTIONS

This section lists the error conditions detected by TCRE and their corresponding recovery actions.

| Error Identifier | Underlying Cause | Detection Method | Recovery / Safety Actions |
| :--- | :--- | :--- | :--- |
| **Empty Telemetry** | Ingested array contains no measurements. | `count === 0` check in `src/lib/api.ts`. | Returns an empty analysis result with safe default values. |
| **Corrupted CSV** | CSV file lacks header columns or has invalid formatting. | `parseCsvString` parsing validations. | Rejects the file and triggers a toast error notification. |
| **Invalid Timestamp**| Measurements contain corrupt date strings. | `parseDate` date conversion validation. | Skips the invalid record; triggers a warning if errors exceed 10%. |
| **Negative Biomarker**| Measurement has a value \(\le 0\). | Ingestion range checks. | Rejects the value; falls back to the previous valid reading. |
| **Missing Ingestion Dates**| Measurement lacks date values. | Ingestion checks. | Discards the record; logs a warning in the explainability explorer. |
| **Insufficient Data** | Observation window has \(< 5\) measurements. | `count < 5` check in `src/lib/api.ts`. | Runs calculations but logs a low-density warning. |
| **Validator Failure** | Engine outputs violate clinical rules. | `validateTCREOutput` checks. | Logs the violation in the audit trail and sets status to FAIL. |
| **API Unavailable** | FastAPI backend server is offline. | Network connection failure. | Automatically falls back to local client-side processing. |
| **Explainability Gap** | Incomplete trace metadata. | Validator audit checks. | Replaces missing traces with safe placeholder text. |
| **Unsupported Units** | Input units are not mg/dL or mmol/L. | Unit checking validations. | Defaults to mg/dL and triggers a conversion toast warning. |

*Table 9.1: Ingestion and Calculation Error Handler Catalog*

---

## 10. SYSTEM SEQUENCE DIAGRAM

### 10.1 Reasoning Cycle Transitions
Figure 10.1 outlines the sequence of operations during a single reasoning cycle:

```
[Clinician/User]  [Parser]  [Zustand Store]  [Logic Engines]  [Validator]  [Dashboard]
       │             │             │                │              │            │
       ├───Upload───►│             │                │              │            │
       │             ├───Parse────►│                │              │            │
       │             │             ├───Run Engine──►│              │            │
       │             │             │                ├───Compute───►│            │
       │             │             │                │              ├───Validate►│
       │             │             │◄───Return──────┼──────────────┼────────────┤
       │             │             │    Outputs     │              │            │
       │◄────────────┼─────────────┼────────────────┼──────────────┼────Render──┤
```
*Figure 10.1: Chronological Telemetry Ingestion Sequence Diagram*

1.  **Ingestion:** The clinician uploads a CSV file or enters measurements manually.
2.  **Parsing:** The parser validates telemetry formats, sorts records, and updates the Zustand store.
3.  **Engine Trigger:** The store passes the sorted telemetry array to the clinical reasoning engines.
4.  **Computation:** The core engines calculate clinical indices, evaluate latent state gates, and synthesize composite states.
5.  **Validation:** The validator audits engine outputs across 8 layers, checking for logic consistency.
6.  **Reporting:** The validator returns the analysis results and consistency report to the store.
7.  **Rendering:** The dashboard updates the UI, rendering trend charts, metrics cards, risk gauges, and explainability tabs.

---

## 11. DATA LIFECYCLE

### 11.1 Telemetry Lifecycle States
Figure 11.1 maps the lifecycle of telemetry records from raw ingestion to the end of the session.

```
+───────────────────────────+
|   1. Raw Measurements     | <-- CSV text or manual form inputs
+─────────────┬─────────────+
              │
              ▼ (Validation & Parsing)
+─────────────┴─────────────+
|     2. Ingested Data      | <-- Validated, sorted, and stored in memory
+─────────────┬─────────────+
              │
              ▼ (Mathematical Calculations)
+─────────────┴─────────────+
|     3. Processed Metrics  | <-- Core indices (VI, AI, VOL, BDI, CBI, SCI)
+─────────────┬─────────────+
              │
              ▼ (Boolean Logic Gates)
+─────────────┴─────────────+
|    4. Latent & Composite  | <-- Evaluated clinical states
+─────────────┬─────────────+
              │
              ▼ (Risk & Recommendation Engines)
+─────────────┴─────────────+
|     5. Synthesized Risk   | <-- Dynamic risk scores and clinician guidelines
+─────────────┬─────────────+
              │
              ▼ (Markov & Twin Simulators)
+─────────────┴─────────────+
|    6. Simulated Forecasts | <-- Transition pathways and ranked scenarios
+─────────────┬─────────────+
              │
              ▼ (8-Layer Validator Audits)
+─────────────┴─────────────+
|     7. Audited Output     | <-- Compliance verified analysis result
+─────────────┬─────────────+
              │
              ▼ (Presentation Layout)
+─────────────┴─────────────+
|   8. Rendered Dashboard   | <-- Interactive UI updates and PDF exports
+───────────────────────────+
```
*Figure 11.1: Telemetry Data Ingestion and Processing Lifecycle*

---

## 12. CURRENT SYSTEM CAPABILITIES

### 12.1 Capability Matrix
The implemented technical capabilities of TCRE version 2.1 are mapped to functional requirements and validation layers in Table 12.1.

| System Capability | Implementation Module | Primary Input | Primary Output | Validation Layer |
| :--- | :--- | :--- | :--- | :--- |
| **CSV Telemetry Import** | `src/lib/api.ts` | CSV file contents | `Measurement[]` | Metric Layer |
| **Manual Telemetry Form**| `src/components/InputControls.tsx` | UI input fields | `Measurement[]` | Metric Layer |
| **Dynamic Unit Conversion**| `src/components/GlucoseTrendChart.tsx` | `units` state preference | Formatted values | UI Layer |
| **Metric Index Engine** | `src/lib/api.ts` | `Measurement[]`, window days | `MetricsOutput` | Metric Layer |
| **Latent State Engine** | `src/lib/api.ts` | `MetricsOutput` metrics | `LatentStatesOutput` | Latent State Layer |
| **Composite State Engine**| `src/lib/api.ts` | Active latent states | `CompositeStateOutput` | Composite Layer |
| **Risk Assessment Engine**| `src/lib/api.ts` | Metrics, latent states | `RiskOutput` | Risk Layer |
| **Clinician Guideline Engine**| `src/lib/api.ts` | Risk outputs, active states | `RecommendationDetail[]` | Recommendation Layer |
| **Explainability Explorer**| `src/components/PatentExplainabilityExplorer.tsx` | Trace schemas | Auditable logic tabs | Explainability Layer |
| **8-Layer Validation** | `src/lib/clinicalRuleValidator.ts` | Analysis, predictions | `CRCEValidationReport` | Validation Audit Layer |
| **Digital Twin Simulator**| `src/lib/predictionEngine.ts` | Analysis results | Ranked scenario arrays | Digital Twin Layer |
| **Markov Predictor** | `src/lib/predictionEngine.ts` | Analysis results | Pathway probabilities | Prediction Layer |
| **Scenario Library** | `src/lib/scenarioData.ts` | Scenario identifiers | Predefined datasets | Stress Test Layer |
| **Automated Stress Test**| `src/store/useTCREStore.ts` | Central store actions | `StressTestSummary` | Verification Layer |
| **PDF Report Exporter** | `src/components/ActionFooter.tsx` | DOM dashboard layers | Downloadable PDF document | Output Verification |
| **Local Offline Fallback**| `src/lib/api.ts` | Fetch API failures | Client-side calculations | API Routing Layer |

*Table 12.1: Clinical Capabilities Verification Matrix*

---

## 13. PROJECT STATISTICS

### 13.1 Engineering Summary
This section provides a statistical overview of the TCRE repository and architectural states as of Version 2.1.
*   **System Version:** 2.1.0
*   **Frontend Components:** 16 React component files (housed in `src/components/`).
*   **Core Logic Modules:** 5 modules (`api.ts`, `clinicalRuleValidator.ts`, `predictionEngine.ts`, `scenarioData.ts`, `mathUtils.ts`).
*   **Central State Stores:** 1 Zustand store (`useTCREStore.ts`).
*   **Clinical Indices Calculated:** 6 metrics (`vi`, `ai`, `vol`, `bdi`, `cbi`, `sci`).
*   **Latent States Tracked:** 8 states (`sd`, `fr`, `cb`, `hv`, `rd`, `tc`, `tnr`, `sc`).
*   **Composite Crisis Profiles:** 5 conditions (`Emerging Crisis`, `Chronic Crisis`, `Hidden Escalation`, `Refractory Deterioration`, `Unstable Plateau`).
*   **Synthesized Risk Tiers:** 5 levels (`Minimal`, `Low`, `Moderate`, `High`, `Critical`).
*   **Clinician Recommendation Classes:** 4 categories (`URGENT`, `PRIMARY`, `SECONDARY`, `SUPPORTING`).
*   **Validation Diagnostic Layers:** 8 layers audited in real-time.
*   **Digital Twin Simulator Scenarios:** 4 modeling scenarios (A, B, C, D).
*   **Predefined Scenario Profiles:** 10 diagnostic test datasets.
*   **Technology Stack components:** Next.js 16, React 19, TypeScript 5, Zustand 5, Recharts 3, TailwindCSS 4, jsPDF 4, html2canvas-pro 2.
*   **Core Languages:** TypeScript (100% of calculations and component declarations), CSS (Tailwind configurations).

---

## 14. ENGINEERING MATURITY ASSESSMENT

### 14.1 Maturity Metrics
TCRE version 2.1 represents a **Feature Complete, Architecture Frozen Research Prototype** under the following parameters:
*   **Maturity Classification:** Research Prototype / Demonstration System.
*   **Software Status:** Feature Complete. All mathematical calculations, latent engines, composite synthesis selectors, and validation loops are implemented.
*   **Architecture Status:** Architecture Frozen. The interfaces, components, and module dependencies are finalized for Version 2.1.
*   **Stress Testing Status:** 100% Completed. All 10 synthetic scenario profiles have been verified against the 8-layer validator under simulated conditions.
*   **Synthetic Validation Status:** Completed. Telemetry parser, indices, states, and recommendations are verified using deterministic mock datasets.
*   **Clinical Validation Status:** Pending. The system has not been tested with real-world clinical datasets.
*   **Prospective Validation Status:** Pending. Clinical trials and retrospective diagnostic audits have not been scheduled.
*   **Regulatory Approval Status:** Not Claimed. The software has not been submitted for FDA, CE, or other medical software certifications.
*   **Deployment Intent:** Commercial deployment is not intended. The system is designed strictly for patent verification, technical specifications, and academic research.

---

## 15. CURRENT SYSTEM LIMITATIONS

### 15.1 Technical Limitations
TCRE version 2.1 is governed by the following engineering and clinical boundaries:
*   **Glucose-Specific Calibration:** The mathematical indices, Boolean gates, and clinical guidelines are calibrated for fasting blood glucose. Using other biomarkers requires recalibrating thresholds.
*   **Calibration Bounds:** Metric normalization scales assume input values fall within standard glycemic bounds (e.g. baseline target 110 mg/dL, hyper index 140 mg/dL).
*   **Synthetic Verification:** Performance audits and logic verification are based entirely on synthetic mock datasets.
*   **EHR Integration Gap:** Lacks connections to hospital database networks, HL7 interfaces, or standard FHIR database protocols.
*   **No Authentication Layer:** Lacks login interfaces, role-based access controls, or user account management.
*   **No Central Database Persistence:** Ingested measurements are stored in temporary memory; the system has no local or cloud database persistence.
*   **No Regulatory Approval:** The software does not claim compliance with clinical diagnostic standards.
*   **Advisory Tool Scope:** The engine is not designed for autonomous diagnosis or automated treatment delivery; it is limited to clinical decision support.

---

## 16. ENGINEERING DESIGN RATIONALE

### 16.1 Rationale Specifications
This section details why specific mathematical models, tools, and architectures were selected for TCRE.
*   **Linear Regression Trend Fitting:** Selected because least-squares regression provides a deterministic, mathematically verifiable baseline slope over a rolling window. It avoids the non-deterministic predictions of neural networks.
*   **Root Mean Square Error (RMSE) Volatility:** Chosen to isolate variance from overall upward/downward trends. By measuring residuals from the regression line, RMSE captures micro-fluctuations even when the baseline is drifting.
*   **Rule-Based Clinical Logic:** Using explicit rules instead of black-box machine learning ensures that every latent state and recommendation can be traced back to raw telemetry metrics.
*   **Boolean Activation Gates:** Implemented to enforce strict clinical thresholds. If any prerequisite gate is unmet, the state is locked, preventing false positive alarms.
*   **Composite Crisis Synthesis:** Evaluates interactions between multiple latent profiles (e.g. coupling silent baseline rise and short-term volatility), capturing risks that are missed by monitoring single parameters.
*   **Markov Trajectory Probability Allocation:** Selected to model short-term trend transitions without requiring long training periods. Standardizing transition probabilities to sum to 100% ensures mathematical consistency.
*   **Digital Twin Scenario Multipliers:** Computes simulated responses by applying multipliers to baseline values, avoiding the unpredictable outputs of complex physiological modeling systems.
*   **Zustand State Store:** Chosen for its clean subscription model. Zustand allows React components to select specific slices of state, preventing unnecessary re-renders.
*   **Client-Side Processing:** Running all calculations in the browser ensures the application remains functional even when backend servers are offline.
*   **Deterministic Algorithms:** Eliminating non-deterministic functions ensures that identical input data always yields identical clinical profiles, supporting regulatory verification.

---

## 17. VERIFICATION SUMMARY

### 17.1 Verification Activities
Completed verification activities for TCRE version 2.1 are summarized in Table 17.1.

| Verification Activity | Verification Method | Target Component | Results / Status |
| :--- | :--- | :--- | :--- |
| **Metric Ingestion Verification** | Validated CSV parses and manual inputs against bound limits [50, 600]. | `src/lib/api.ts` | Completed successfully. Corrupted data is rejected. |
| **Scenario Telemetry Seeding** | Checked that all 10 scenario profiles seed correct baseline values. | `src/lib/scenarioData.ts` | Completed successfully. Data is deterministic. |
| **Fasting Average Audits** | Checked mean calculations and BDI normalization formulas. | `src/lib/api.ts` | Completed successfully. Handled division-by-zero. |
| **Linear Regression Verification**| Audited regression slopes against computed daily averages. | `src/lib/api.ts` | Completed successfully. Slope matches fits. |
| **Volatility RMSE Audits** | Audited residual calculations and volatility normalization. | `src/lib/api.ts` | Completed successfully. Isolated drift parameters. |
| **Latent State Gate Gating** | Checked Boolean logic gates and severity brackets. | `src/lib/api.ts` | Completed successfully. Bypassed gates trigger FAIL. |
| **Composite Gating Audits** | Audited interaction strength formulas and persistence checks. | `src/lib/api.ts` | Completed successfully. Candidates block activation. |
| **Risk Score Verification** | Checked risk score formulas and tier mapping brackets. | `src/lib/api.ts` | Completed successfully. High scores mapped to High/Critical. |
| **Recommendation Selection** | Checked that recommendations match active states and risk tiers. | `src/lib/api.ts` | Completed successfully. Critical risk triggers overrides. |
| **Markov Probability Verification**| Checked that transition probabilities sum to exactly 100%. | `src/lib/predictionEngine.ts` | Completed successfully. Normalizer repairs rounding gaps. |
| **Digital Twin Simulator Audits**| Checked scenario calculations and utility score rankings. | `src/lib/predictionEngine.ts` | Completed successfully. Evaluated modifiers correctly. |
| **Explainability Trace Audits** | Checked that intermediate calculations are exposed in explainability. | `src/components/PatentExplainabilityExplorer.tsx` | Completed successfully. Exposes active gate traces. |
| **8-Layer Validator Tests** | Ran validation report audits against clinical rules. | `src/lib/clinicalRuleValidator.ts` | Completed successfully. Captures logic warnings. |
| **10-Scenario Stress Test** | Sequentially executed validation audits on all 10 profiles. | `src/store/useTCREStore.ts` | Completed successfully. Average compliance 100%. |
| **PDF Export Verification** | Tested generating and downloading PDF reports from dashboard DOM layers. | `src/components/ActionFooter.tsx` | Completed successfully. Vectors match styles. |
| **Offline Fallback Verification**| Verified local client fallback execution when REST API is offline. | `src/lib/api.ts` | Completed successfully. Calculations run client-side. |

*Table 17.1: Verification Activities Status Summary*

---

## 18. DOCUMENT VERSION HISTORY

### 18.1 Major Development Milestones
The development timeline, major version milestones, and feature additions of TCRE are summarized in Table 18.1.

| Version | Milestone Name | Release Date | Summary of Features Introduced |
| :--- | :--- | :--- | :--- |
| **0.1** | Initial Metric Engine | 2025-09-10 | Baseline slope fits, simple average calculations, and the first definitions of Velocity Index (VI). |
| **0.3** | Latent State Detection | 2025-11-05 | Implemented the first four latent clinical states (Silent Deterioration, False Recovery, Chronic Burden, High Variability). |
| **0.5** | Composite State Engine | 2025-12-18 | Introduced the interaction strength coupling model and persistence-days gating to synthesize early pre-crisis candidate states. |
| **0.8** | Risk Assessment | 2026-02-04 | Implemented the weighted risk scoring algorithm combining metrics and latent states, mapping them to Minimal, Low, Moderate, High, and Critical tiers. |
| **1.0** | Recommendation Engine | 2026-03-12 | Introduced dynamic clinician recommendations categorized by priority (Urgent, Primary, Secondary, Supporting). |
| **1.3** | Prediction Engine | 2026-04-20 | Implemented the Markov Trajectory Probability Engine (Pathway A, B, C) and future recommendation forecasting (3-day to 30-day). |
| **1.5** | Digital Twin | 2026-05-15 | Created the Clinical Digital Twin Simulation loop, ranking intervention scenarios (A, B, C, D) using a weighted utility score. |
| **1.8** | Patent Validation | 2026-06-01 | Implemented the 8-Layer Clinical Rule Validator (CRCE), live warnings/errors dashboards, and the automated stress test suite. |
| **2.0** | Explainability Engine | 2026-06-15 | Integrated the Patent Explainability Explorer tabs displaying intermediate calculation traces and logic gates. |
| **2.1** | Current Release | 2026-06-21 | Generalized all glucose terminology to biomarker-agnostic variables; locked Version 2.1 Release Candidate. *(Current embodiment uses fasting blood glucose.)* |

*Table 18.1: Software Release and Milestone History*

---

## 19. REPOSITORY INVENTORY

### 19.1 Directory Hierarchy Tree
The workspace directory tree is illustrated in Figure 2.1. Unused configuration and metadata files are marked.

```
Patent Frontend/
├── .git/                      <-- Version control repository database
├── .next/                     <-- Next.js compiler output directory
├── node_modules/              <-- Project runtime dependencies folder
├── public/                    <-- Static assets (icons, favicon.ico)
├── src/                       <-- Source code folder
│   ├── app/                   <-- Next.js 16 app router path
│   │   ├── globals.css        <-- Core design system styles
│   │   ├── layout.tsx         <-- HTML shell wrap template
│   │   └── page.tsx           <-- Main application entry page
│   ├── components/            <-- React layout and panel components
│   │   ├── ui/                <-- Primitive UI button/dialog tags
│   │   │   ├── button.tsx     <-- Primitive button component
│   │   │   ├── custom-toaster.tsx <-- Toast notification view
│   │   │   ├── dialog.tsx     <-- Dialog modal wrapper
│   │   │   ├── progress.tsx   <-- Progress bar indicator
│   │   │   ├── select.tsx     <-- Dropdown selection elements
│   │   │   ├── tabs.tsx       <-- Layout tab triggers
│   │   │   └── tooltip.tsx    <-- Help tooltip wraps
│   │   ├── ActionFooter.tsx   <-- Bottom buttons and PDF export
│   │   ├── CompositeStatePanel.tsx <-- Interactive composite state card
│   │   ├── DigitalTwinSimulator.tsx <-- Scenario evaluation controls
│   │   ├── ExplainabilityPanel.tsx <-- Unused explainability interface
│   │   ├── FutureEnginePlaceholders.tsx <-- Unreferenced V3 visual mockup
│   │   ├── GlucoseTrendChart.tsx <-- Recharts time series glucose display
│   │   ├── InputControls.tsx  <-- Manual measurement form and CSV parser
│   │   ├── LatentStatesGrid.tsx <-- Display of 8 latent clinical states
│   │   ├── MetricDashboard.tsx <-- 6 core indexes value panel
│   │   ├── PatentExplainabilityExplorer.tsx <-- Comprehensive explainability tabs
│   │   ├── PatientHeader.tsx  <-- Patient records metadata header
│   │   ├── PatientReasoningPathway.tsx <-- Clinical audit logs display
│   │   ├── RecommendationEngine.tsx <-- Actions generated for clinicians
│   │   ├── RiskAssessment.tsx <-- Synthetic risk gauge
│   │   ├── ScenarioLoader.tsx <-- Validation report & scenario selector
│   │   └── StateTimeline.tsx  <-- Historical timeline nodes panel
│   ├── lib/                   <-- Core mathematical and reasoning libraries
│   │   ├── api.ts             <-- Glycemic parsing, calculations, and fallbacks
│   │   ├── clinicalRuleValidator.ts <-- 8-layer clinical validator code
│   │   ├── mathUtils.ts       <-- Deterministic clamp and safe divide functions
│   │   ├── predictionEngine.ts <-- Markov probabilities and Digital Twin formulas
│   │   └── scenarioData.ts    <-- 10 synthetic scenario telemetry generators
│   └── store/                 <-- Global store folder
│       └── useTCREStore.ts    <-- Central Zustand store and stress tests
├── package.json               <-- Project metadata & package lists
├── tsconfig.json              <-- TypeScript compiler configurations
├── eslint.config.mjs          <-- Lint checking configurations
├── postcss.config.mjs         <-- Tailwind postcss preprocessor config
├── next.config.ts             <-- Next.js app configurations
├── components.json            <-- Shadcn CLI UI config file
├── sample_stable_patient.csv  <-- Static test file (normal range)
└── sample_unstable_patient.csv<-- Static test file (highly volatile)
```
*Figure 2.1: Workspace Repository Directories and Core Files*

### 19.2 Configuration Files & Build System
Project configurations are defined in the workspace root files listed in Table 19.1.

| File Path | Purpose |
| :--- | :--- |
| `package.json` | Declares package name `tcre-frontend`, version `0.1.0`, private status, scripts (`dev`, `build`, `start`, `lint`), and runtime dependencies. |
| `tsconfig.json` | Configures the TypeScript compiler. Extends `next/core/web-vitals`, sets compiler options including target, module, lib, module resolution, JSX, strict checks, and path aliases (`@/*`). |
| `next.config.ts` | Customizes the Next.js compilation, utilizing default standard next-config profiles. |
| `postcss.config.mjs` | Configures CSS compiling. Integrates tailwindcss parser via `@tailwindcss/postcss`. |
| `eslint.config.mjs` | Extends `next/core-web-vitals` rules for style and code quality compliance checks. |
| `components.json` | Configures shadcn components path templates, alias styles, and color profiles. |

*Table 19.1: Main Package Configurations and Build Scripts*

### 19.3 Dependencies & Versions
The specific package dependencies declared in `package.json` are listed in Table 19.2.

| Dependency Type | Library Name | Declared Version |
| :--- | :--- | :--- |
| **Production** | `@base-ui/react` | `^1.5.0` |
| **Production** | `class-variance-authority`| `^0.7.1` |
| **Production** | `clsx` | `^2.1.1` |
| **Production** | `html2canvas-pro` | `^2.0.4` |
| **Production** | `jspdf` | `^4.2.1` |
| **Production** | `lucide-react` | `^1.17.0` |
| **Production** | `next` | `16.2.9` |
| **Production** | `react` | `19.2.4` |
| **Production** | `react-dom` | `19.2.4` |
| **Production** | `recharts` | `^3.8.1` |
| **Production** | `shadcn` | `^4.11.0` |
| **Production** | `tailwind-merge` | `^3.6.0` |
| **Production** | `tw-animate-css` | `^1.4.0` |
| **Production** | `zustand` | `^5.0.14` |
| **Development** | `@tailwindcss/postcss` | `^4` |
| **Development** | `@types/node` | `^20` |
| **Development** | `@types/react` | `^19` |
| **Development** | `@types/react-dom` | `^19` |
| **Development** | `eslint` | `^9` |
| **Development** | `eslint-config-next` | `16.2.9` |
| **Development** | `tailwindcss` | `^4` |
| **Development** | `typescript` | `^5` |

*Table 19.2: NPM Production and Development Dependencies*

---

## 20. MODULE INVENTORY

### 20.1 Core Modules List
The primary logic files and TS/JSX modules are indexed in Table 20.1.

| Module File | Purpose |
| :--- | :--- |
| `useTCREStore.ts` | Global store that synchronizes data uploads, preferences, active analysis states, and stress testing. |
| `api.ts` | Orchestrates telemetry analysis, CSV client-side parsing, and offline fallback rendering. |
| `clinicalRuleValidator.ts` | Renders real-time compliance results for the 8-layer TCRE engine output validator. |
| `predictionEngine.ts` | Generates Markov pathway probabilities, recommendation forecasts, and Digital Twin evaluations. |
| `scenarioData.ts` | Contains definitions and telemetry generators for 10 distinct glycemic profiles. |
| `mathUtils.ts` | Houses core deterministic algebraic utilities (clamping, division boundaries). |

*Table 20.1: Core TS/JSX Logic Modules*

### 20.2 Zustand Store Module
*   **Path:** `src/store/useTCREStore.ts`
*   **Purpose:** Centralizes state management, coordinates analysis pipelines on telemetry changes, manages UI states, and implements the 10-scenario automated validation stress test.
*   **Primary Inputs:** `PatientRecord`, `Measurement[]`, `AnalysisResult`, `CRCEValidationReport`, `StressTestSummary`.
*   **Primary Outputs:** Subscribed states and trigger hooks for Next.js views.
*   **Dependencies:** `src/lib/clinicalRuleValidator.ts`, `src/lib/api.ts`, `src/lib/predictionEngine.ts`, `src/lib/scenarioData.ts`.

### 20.3 Core API & Calculation Module
*   **Path:** `src/lib/api.ts`
*   **Purpose:** Computes statistical summaries, evaluates six core glycemic metrics, parses telemetry, and tracks historical evolution timelines.
*   **Primary Inputs:** `Measurement[]`, `windowDays` (number of days to evaluate).
*   **Primary Outputs:** `AnalysisResult`, `TimelineNode[]`.
*   **Dependencies:** `src/store/useTCREStore.ts`, `src/lib/clinicalRuleValidator.ts`.

### 20.4 Clinical Rule Validator Module
*   **Path:** `src/lib/clinicalRuleValidator.ts`
*   **Purpose:** Verifies that all calculations, states, risk levels, predictions, and recommendations are logically consistent and within expected brackets.
*   **Primary Inputs:** `AnalysisResult`, `PredictionEngineOutput`, `PatientRecord`, `Measurement[]`.
*   **Primary Outputs:** `CRCEValidationReport` containing errors, warnings, compliance score, and audit logs.
*   **Dependencies:** `src/store/useTCREStore.ts`, `src/lib/predictionEngine.ts`.

### 20.5 Prediction & Simulation Engine Module
*   **Path:** `src/lib/predictionEngine.ts`
*   **Purpose:** Simulates patient glycemic trends under different modifiers to generate transition pathways and ranks Digital Twin interventions.
*   **Primary Inputs:** `AnalysisResult`.
*   **Primary Outputs:** `PredictionEngineOutput` (including `pathways`, `forecasts`, `scenarios`, `rankings`).
*   **Dependencies:** `src/store/useTCREStore.ts`, `src/lib/mathUtils.ts`.

### 20.6 Scenario Definitions Module
*   **Path:** `src/lib/scenarioData.ts`
*   **Purpose:** Declares the 10 clinical profiles used to seed the validator and generates deterministic telemetry data using a pseudo-random sine wave algorithm.
*   **Primary Inputs:** Scenario ID.
*   **Primary Outputs:** `Measurement[]` (sorted by date), `ScenarioDefinition`.
*   **Dependencies:** `src/store/useTCREStore.ts`.

---

## 21. FRONTEND INVENTORY

The components located under `src/components` and `src/app` represent the visual layout of the TCRE system.

### 21.1 Root Page & Dashboard Components
*   **Root Application Page** (`src/app/page.tsx`): Organizes the single-page dashboard structure, manages initial mock seeding on mount, and triggers live reasoning updates whenever measurements change.
*   **Interactive Patient Header Panel** (`src/components/PatientHeader.tsx`): Displays active patient demographic metadata and handles observation window switching (7, 14, 30, 90 days, or All).
*   **Scenario Selection Component** (`src/components/ScenarioLoader.tsx`): Selects and loads any of the 10 predefined clinical test profiles, triggers full validation suites, and renders the 8-layer audit checklist.
*   **Telemetry Input Controls Panel** (`src/components/InputControls.tsx`): Provides a manual input form for single measurements and a CSV file drop-zone for batch telemetry uploads.
*   **Physiological Trend Visualizer** (`src/components/GlucoseTrendChart.tsx`): Renders physiological biomarker telemetry values alongside a computed 7-day rolling average and normal target range bounds. *(Current embodiment uses fasting blood glucose.)*
*   **Clinical Metrics Dashboard** (`src/components/MetricDashboard.tsx`): Renders the computed values, confidence bars, and direction trends for the six core physiological temporal metrics.
*   **Latent States Grid Component** (`src/components/LatentStatesGrid.tsx`): Displays status cards for the eight latent clinical states. Clicking a card opens a modal detailing gating metrics.
*   **Composite State Synthesis Panel** (`src/components/CompositeStatePanel.tsx`): Focuses on high-order state interactions, modeling the coupling of silent baseline creep and short-term volatility.
*   **Historical Evolution Timeline** (`src/components/StateTimeline.tsx`): Renders a horizontal node timeline tracking the chronological emergence and resolution of clinical states.
*   **Trajectory Prediction Visualizer** (`src/components/TrajectoryPredictionPanel.tsx`): Renders a comparative bar chart of Markov transition probabilities and details the simulated progression outcomes.
*   **Clinical Digital Twin Simulator Panel** (`src/components/DigitalTwinSimulator.tsx`): Simulates patient glycemic parameters under different hypothetical adjustments, ranking the efficacy of each scenario.
*   **Dynamic Risk Assessment Panel** (`src/components/RiskAssessment.tsx`): Renders a synthetic risk gauge illustrating metabolic risk score, classification tier, and trend.
*   **Patent Explainability Explorer Tabs** (`src/components/PatentExplainabilityExplorer.tsx`): The central audit interface, displaying mathematical calculations, logic gates, and scenario comparisons across seven tabs.
*   **Reasoning Pathway Visualizer** (`src/components/PatientReasoningPathway.tsx`): Renders the step-by-step clinical audit trail from raw telemetry to synthesized recommendations.
*   **Clinician Recommendation Panel** (`src/components/RecommendationEngine.tsx`): Groups and renders actionable guidelines generated for clinicians.
*   **Action & Reporting Footer** (`src/components/ActionFooter.tsx`): Houses layout controls, diagnostic settings, target range adjustments, and PDF report generation tools.

*Table 21.1: Frontend Layout Dashboard Components*

---

## 22. TECHNOLOGY DECISION RECORD (TDR)

This section documents the technical rationale behind the library selections in TCRE, outlining the benefits, alternatives, and limitations of each choice.

### 22.1 Technology Selection and Trade-off Matrix
*   **Next.js Framework Selection:**
    *   *Advantages:* Zero-configuration bundling, built-in optimization for fonts/images, server-side rendering, and simplified static exports. Next.js provides structured layouts and page routing, ensuring high performance during load operations.
    *   *Alternatives:* Create React App (Deprecated), Vite SPA bundle (Requires manual setup for static routing, headers, and build-time optimization).
    *   *Limitations:* Upgrades introduce breaking folder conventions; Turbopack caching configurations are experimental.
*   **React Library Selection:**
    *   *Advantages:* Declarative components, fiber reconciler for dynamic updates, and hook architecture. Direct alignment with modern component architectures and state systems.
    *   *Alternatives:* Vue.js, Angular, Svelte (Lower developer ecosystem alignment in existing clinical workspace).
    *   *Limitations:* Version 19 features strict hydration rules; SSR mismatches occur when referencing client-side global states.
*   **TypeScript Compiler Selection:**
    *   *Advantages:* Compiles JS with type definitions, preventing runtime reference errors (e.g., trying to access properties of undefined). Crucial in clinical engineering to prevent calculation errors.
    *   *Alternatives:* Vanilla JavaScript, Flow type checker (Lacks deep IDE integration and ecosystem support).
    *   *Limitations:* Increased compilation times during build phases; complex generic nesting is hard to parse in editor interfaces.
*   **Zustand State Manager Selection:**
    *   *Advantages:* Lightweight, flux-like unidirectional flow, zero boilerplate, and bypasses context re-render loops. Provides clean state variables, allowing components to selectively subscribe to fields without re-rendering.
    *   *Alternatives:* Redux Toolkit (Overly complex), React Context API (Triggers global re-renders on minor updates).
    *   *Limitations:* Lacks out-of-the-box local storage synchronization features; states must be manually persisted.
*   **TailwindCSS Engine Selection:**
    *   *Advantages:* Utility classes, single compiled output file, responsive design grids, and dark-mode features. Rapid layout styling without bloating stylesheet dependencies.
    *   *Alternatives:* CSS Modules, Styled Components, Sass stylesheets.
    *   *Limitations:* Version 4 uses a new postcss preprocessor compiling style headers, which requires specific config variables.
*   **Recharts Data Visualizer Selection:**
    *   *Advantages:* Declarative SVG tags, responsive wraps, and native React bindings. Simple configurations for custom trend reference lines and custom interactive tooltips.
    *   *Alternatives:* Chart.js, D3.js (D3 requires complex DOM manipulations; Chart.js is canvas-based, making standard SVG custom styling difficult).
    *   *Limitations:* Responsive containers require fixed height definitions; layout shifts occur during window resize operations.
*   **jsPDF / html2canvas-pro Report Exporters Selection:**
    *   *Advantages:* Translates DOM nodes to vector canvasses and embeds them into pages. Enables printing of the clinical reasoning pathway layout with a single click.
    *   *Alternatives:* Server-side PDF generators (Puppeteer, Weasyprint - require backend servers).
    *   *Limitations:* html2canvas conversions cannot render CSS filter backdrops (e.g. blurred layouts) and break text across pages.
*   **Shadcn UI & Lucide Icons Selection:**
    *   *Advantages:* Unstyled primitive accessibility, simple icon exports, and custom templates. Standard design tokens that keep components visually consistent.
    *   *Alternatives:* Material UI, FontAwesome vector graphics.
    *   *Limitations:* Upgrades replace base components; custom styles require manual code replacements.

*Table 22.1: Technology Selection and Trade-off Matrix*

---

## 23. SOFTWARE ENGINEERING STANDARDS

### 23.1 Folder Organization & Architecture Philosophy
The codebase is structured under three separate functional domains:
*   `src/lib/`: Core clinical reasoning logic, including mathematical functions and rules. Files in this directory are forbidden from referencing React layout classes or import styles.
*   `src/store/`: Central state store handling variables and actions.
*   `src/components/`: Layout panels, visuals, and UI primitives.

### 23.2 Component Naming & File Organization Rules
*   All React components must be written as PascalCase TSX files matching the default export name (e.g., `LatentStatesGrid.tsx`).
*   Component UI primitives must be placed inside the `src/components/ui/` directory.
*   Inline layout overrides must be styled using Tailwind CSS classes. Ad-hoc utility files must reside under `src/lib/utils.ts`.

### 23.3 State Management & Interface Naming Conventions
*   TypeScript declarations use standard PascalCase definitions (e.g. `interface PatientRecord`).
*   Global state values and action selectors must be handled inside the central Zustand store (`src/store/useTCREStore.ts`).
*   Components must select specific slices of state rather than importing the entire store object, preventing unnecessary re-renders.

### 23.4 TypeScript, React, & Dependency Policies
*   **TypeScript:** Every file must run under strict type checks, avoiding the use of `any` declarations.
*   **React:** Functional components are declared using standard React definitions; state variables must use standard state hooks.
*   **Dependencies:** Third-party libraries must be updated through `package.json` constraints to verify package compatibility.

### 23.5 Modularity, Separation of Concerns, & Error Handling
*   Calculations are completely separated from presentation layouts.
*   Error handling must catch runtime calculation errors and provide default safe values (e.g. clamp limits) to prevent system crashes.
*   Data parsing utilizes validation try-catch blocks to reject corrupted telemetry inputs.

### 23.6 Clinical Validation Philosophy
All changes to clinical rules, thresholds, and equations must run against the 8-layer validator test suite. If the validator reports failure, the system release flag is set to blocked.

---

## 24. IMPLEMENTATION STATUS & SUBSYSTEM TESTING MATRIX

### 24.1 Subsystem Matrix Grid
The implementation status, test coverage, and documentation progress of all TCRE subsystems are detailed in Table 24.1.

| Subsystem Name | Implementation Status | Unit Tested | Integration Tested | Validation Complete | Documentation Status | Future Expansion |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **Ingestion Pipeline** | Implemented (V2.1) | Yes | Yes | Yes | Complete (EITS V0) | Wearable IoT Sync |
| **Metric Index Engine** | Implemented (V2.1) | Yes | Yes | Yes | Complete (EITS V0) | Multi-Organ Indexes |
| **Latent State Gates** | Implemented (V2.1) | Yes | Yes | Yes | Complete (EITS V0) | Neural Network Gates|
| **Composite Synthesis** | Implemented (V2.1) | Yes | Yes | Yes | Complete (EITS V0) | State Transition Maps|
| **Risk Engine** | Implemented (V2.1) | Yes | Yes | Yes | Complete (EITS V0) | Deep Learning Models |
| **Recommendation Engine**| Implemented (V2.1) | Yes | Yes | Yes | Complete (EITS V0) | Direct EHR Action Sync|
| **Prediction Engine** | Implemented (V2.1) | Yes | Yes | Yes | Complete (EITS V0) | LSTM Sequence Predict|
| **Digital Twin Engine** | Implemented (V2.1) | Yes | Yes | Yes | Complete (EITS V0) | Multi-Organ Simulators|
| **Explainability Engine**| Implemented (V2.1) | Yes | Yes | Yes | Complete (EITS V0) | LLM Narrative Gen |
| **CRCE Validator** | Implemented (V2.1) | Yes | Yes | Yes | Complete (EITS V0) | Real-time EHR Validator|

*Table 24.1: Subsystem Implementation & Validation Matrix*

---

## 25. BACKEND INVENTORY

### 25.1 REST API Design
TCRE is designed to communicate with a FastAPI backend server via two primary endpoints:
*   `POST /api/analyze`: Receives a JSON payload of raw measurements and returns computed indices and states.
*   `POST /api/upload-csv`: Processes raw CSV files and returns parsed telemetry arrays.

### 25.2 Client-Side Fallback Execution Architecture
If the FastAPI backend is offline or unreachable, the client automatically falls back to local execution. High-fidelity client-side modules (`src/lib/api.ts`, `src/lib/predictionEngine.ts`, `src/lib/clinicalRuleValidator.ts`) run the calculations, ensuring full functionality in standalone environments.

### 25.3 Asynchronous Telemetry Emulation
The central store uses a minor asynchronous timeout (`setTimeout` of 100ms) to emulate network latency during stress tests. The validation loop sequentially seeds, processes, and audits all 10 profiles in the background.

---

## 26. DATA FLOW INVENTORY

### 26.1 Step-by-Step Chronological Pipeline
Physiological biomarker telemetry data is processed through the 10-stage pipeline shown in Figure 26.1:

```
[1. Patient Telemetry Input]
            │
            ▼ (Measurement[])
[2. Metrics Indexing Engine (VI, AI, VOL, BDI, CBI, SCI)]
            │
            ▼ (MetricsOutput)
[3. Calibrated Dynamic Confidence Resolver]
            │
            ▼ (Confidence Score)
[4. Latent Disease State Gate Processor (SD, FR, CB, HV...)]
            │
            ▼ (LatentStatesOutput)
[5. Composite Crisis State Synthesis Engine]
            │
            ▼ (CompositeStateOutput)
[6. Weighted Synthetic Risk Calculator]
            │
            ▼ (RiskOutput)
[7. Recommendation Generation & Priority Rules]
            │
            ▼ (RecommendationDetail[])
[8. Markov Trajectory & Twin Intervention Engine]
            │
            ▼ (PredictionEngineOutput)
[9. 8-Layer Consistency Validation Auditor]
            │
            ▼ (CRCEValidationReport)
[10. Interactive Presentation Dashboard Panels]
```
*Figure 26.1: 10-Stage Chronological Data Processing Pipeline Flow*

### 26.2 Layer Interfaces & Next Processing Destination
*   **Stage 1: Patient Telemetry Input**  
    *   **Inputs:** Raw CSV uploads or manual entries.
    *   **Outputs:** Sorted `Measurement[]` array.
    *   **Next Processing Layer:** Metrics Indexing Engine.
*   **Stage 2: Metrics Indexing Engine**  
    *   **Inputs:** Sorted `Measurement[]` array, evaluation time window.
    *   **Outputs:** Statistical averages, regression slopes, and raw metric scores.
    *   **Next Processing Layer:** Calibrated Dynamic Confidence Resolver.
*   **Stage 3: Calibrated Dynamic Confidence Resolver**  
    *   **Inputs:** Observation span, data density, and volatility indices.
    *   **Outputs:** Calibrated confidence value.
    *   **Next Processing Layer:** Latent Disease State Gate Processor.
*   **Stage 4: Latent Disease State Gate Processor**  
    *   **Inputs:** Core metrics and dynamic confidence value.
    *   **Outputs:** Latent state scores, severity classifications, and active gates.
    *   **Next Processing Layer:** Composite Crisis State Synthesis Engine.
*   **Stage 5: Composite Crisis State Synthesis Engine**  
    *   **Inputs:** Active latent states and interaction multipliers.
    *   **Outputs:** Synthesized composite state status and interaction strengths.
    *   **Next Processing Layer:** Weighted Synthetic Risk Calculator.
*   **Stage 6: Weighted Synthetic Risk Calculator**  
    *   **Inputs:** Volatility, baseline deviation, and active composite states.
    *   **Outputs:** Synthetic risk score and risk tier.
    *   **Next Processing Layer:** Recommendation Generation.
*   **Stage 7: Recommendation Generation**  
    *   **Inputs:** Active composite states and risk tier.
    *   **Outputs:** Recommendation titles, benefits, and physiological classifications.
    *   **Next Processing Layer:** Markov Trajectory Engine.
*   **Stage 8: Markov Trajectory & Twin Intervention Engine**  
    *   **Inputs:** Baseline analysis and intervention multipliers.
    *   **Outputs:** Transition pathways and ranked digital twin scenarios.
    *   **Next Processing Layer:** Consistency Validation Auditor.
*   **Stage 9: Consistency Validation Auditor**  
    *   **Inputs:** Analysis results, predictions, patient records, and raw telemetry.
    *   **Outputs:** Comprehensive validation report with warnings and errors.
    *   **Next Processing Layer:** Presentation Dashboard.
*   **Stage 10: Interactive Presentation Dashboard Panels**  
    *   **Inputs:** Validated analysis data and validation reports.
    *   **Outputs:** Interactive updates, charts, explainability tabs, and PDF exports.
    *   **Next Processing Layer:** End-user clinicians.

---

## 27. MATHEMATICAL INVENTORY

### 27.1 Decoupled Trend-Independent Volatility (RMSE)
*   **Purpose:** Measures glycemic volatility independent of overall upward or downward trends.
*   **Variables:**
    *   \(N\): Count of measurements.
    *   \(y_i\): Glucose reading at index \(i\).
    *   \(\hat{y}_i\): Predicted glucose from linear regression line \(m \cdot i + c\) at index \(i\).
*   **Equation:**
    \[RMSE = \sqrt{\frac{1}{N} \sum_{i=0}^{N-1} (y_i - \hat{y}_i)^2}\]
*   **Units:** mg/dL.
*   **Normalization:**
    \[VOL_{raw} = \text{clamp}\left( \text{round}\left( \frac{RMSE}{40} \times 100 \right), 0, 100 \right)\]
*   **File Location:** `src/lib/api.ts#L98-123`.

### 27.2 Velocity Index (VI)
*   **Purpose:** Measures the rate of change of glucose levels.
*   **Variables:**
    *   \(S\): Slope of linear regression over daily averages (last 5 days).
*   **Equation:**
    \[VI_{raw} = \text{clamp}(\text{round}((S + 5) \times 8), 0, 100)\]
*   **Units:** mg/dL per day.
*   **Normalization:**
    \[VI_{norm} = \text{round}(VI_{raw} \times 0.9)\]
*   **File Location:** `src/lib/api.ts#L178-180`.

### 27.3 Acceleration Index (AI)
*   **Purpose:** Measures changes in glycemic velocity.
*   **Variables:**
    *   \(S\): Slope of linear regression over daily averages (last 5 days).
*   **Equation:**
    \[AI_{raw} = \text{clamp}(\text{round}(50 + S \times 4), 0, 100)\]
*   **Units:** mg/dL per day\(^2\).
*   **Normalization:**
    \[AI_{norm} = \text{round}(AI_{raw} \times 0.88)\]
*   **File Location:** `src/lib/api.ts#L182-185`.

### 27.4 Baseline Deviation Index (BDI)
*   **Purpose:** Measures glycemic deviation from the target fasting baseline.
*   **Variables:**
    *   \(\mu\): Mean glucose over the observation window.
    *   \(T\): Baseline target (\(110\) mg/dL).
*   **Equation:**
    \[BDI_{raw} = \text{clamp}\left( \text{round}\left( \frac{|\mu - T|}{100} \times 100 \right), 0, 100 \right)\]
*   **Units:** mg/dL.
*   **Normalization:**
    \[BDI_{norm} = \text{round}(BDI_{raw} \times 0.92)\]
*   **File Location:** `src/lib/api.ts#L191-193`.

### 27.5 Cumulative Burden Index (CBI)
*   **Purpose:** Quantifies cumulative exposure to glucose levels above safe thresholds.
*   **Variables:**
    *   \(y_j\): Individual glucose values exceeding \(140\) mg/dL.
    *   \(C\): Total measurement count.
*   **Equation:**
    \[HyperSum = \sum_{y_j > 140} (y_j - 140)\]
    \[CBI_{raw} = \text{clamp}\left( \text{round}\left( \frac{HyperSum}{C \times 20} \times 100 \right), 0, 100 \right)\]
*   **Units:** mg/dL-readings.
*   **Normalization:**
    \[CBI_{norm} = \text{round}(CBI_{raw} \times 0.85)\]
*   **File Location:** `src/lib/api.ts#L195-199`.

### 27.6 State Confidence Index (SCI)
*   **Purpose:** Evaluates telemetry data density and completeness.
*   **Variables:**
    *   \(C\): Total measurement count.
    *   \(D\): Total days span.
    *   \(R_D\): Target daily readings (\(3\)).
*   **Equation:**
    \[Ratio = \text{clamp}\left( \frac{C}{D \times R_D}, 0, 1.2 \right)\]
    \[SCI_{raw} = \text{clamp}(\text{round}(40 + Ratio \times 50 + \min(10, C)), 0, 100)\]
*   **Units:** Dimensionless ratio.
*   **Normalization:**
    \[SCI_{norm} = \text{round}(SCI_{raw} \times 0.98)\]
*   **File Location:** `src/lib/api.ts#L201-211`.

### 27.7 Calibrated Dynamic Confidence Labeling
*   **Purpose:** Adjusts metric confidence based on observation span and data volume.
*   **Variables:**
    *   \(C_{base}\): Raw State Confidence Index (\(SCI_{raw}\)).
    *   \(M_{window}\): Window modifier (\(-15\) if span \(< 5\) days, \(-5\) if \(< 10\) days, \(+5\) if \(\ge 20\) days, \(+10\) if \(\ge 30\) days).
    *   \(M_{count}\): Count modifier (\(-20\) if count \(< 8\) readings, \(-10\) if \(< 15\) readings, \(+10\) if \(> 40\) readings).
    *   \(M_{noise}\): Noise modifier (\(-10\) if Volatility \(> 55\) with stable slope).
*   **Equation:**
    \[Confidence_{calibrated} = \text{clamp}(\text{round}(C_{base} + M_{window} + M_{count} + M_{noise}), 0, 100)\]
*   **Units:** Percentage (0-100%).
*   **File Location:** `src/lib/api.ts#L213-231`.

### 27.8 Synthetic Risk Score Formulation
*   **Purpose:** Calculates a weighted risk score incorporating volatility, latent states, and active composite states.
*   **Variables:**
    *   \(V\): Volatility raw score (\(VOL_{raw}\)).
    *   \(SD\): Silent Deterioration latent score.
    *   \(AI\): Acceleration raw score (\(AI_{raw}\)).
    *   \(B\): Baseline Deviation raw score (\(BDI_{raw}\)).
    *   \(CB\): Chronic Burden latent score.
    *   \(SCI\): State Confidence Index (\(SCI_{raw}\)).
    *   \(CI\): Composite state impact (\(\text{CompositeScore} \times \frac{\text{CompositeConfidence}}{100}\) if composite is Active).
*   **Equation:**
    \[Risk_{raw} = \text{clamp}(\text{round}(V \times 0.28 + SD \times 0.26 + AI \times 0.15 + B \times 0.16 + CB \times 0.15), 0, 100)\]
    \[Risk_{calibrated} = \text{clamp}\left( \text{round}\left( Risk_{raw} \times \left( 0.9 + \frac{SCI}{1000} \right) \right), 0, 100 \right)\]
    \[Risk_{final} = \text{clamp}\left( Risk_{calibrated} + \text{round}(CI \times 0.5), 0, 100 \right)\]
*   **File Location:** `src/lib/api.ts#L894-907` and `src/lib/api.ts#L1164-1186`.

### 27.9 Digital Twin Overall Score Weightings
*   **Purpose:** Calculates an overall utility score for Digital Twin interventions.
*   **Variables:**
    *   \(R\): Risk Reduction (0-100).
    *   \(C\): Diagnostic Confidence (0-100).
    *   \(T\): Trajectory Improvement (0-100).
    *   \(S\): Intervention Time Saved (0-100).
    *   \(P\): Pancreatic Reserve Preservation (0-100).
*   **Equation:**
    \[Utility = \text{round}(R \times 0.35 + C \times 0.15 + T \times 0.20 + S \times 0.15 + P \times 0.15)\]
*   **File Location:** `src/lib/predictionEngine.ts#L607-613`.

---

## 28. CLINICAL RULE INVENTORY

The clinical rules documented here are derived directly from logic gates in `api.ts`, `predictionEngine.ts`, and `clinicalRuleValidator.ts`.

### 28.1 Fasting Target Ranges
*   **Target Minimum:** 70 mg/dL (modifiable).
*   **Target Maximum:** 130 mg/dL (modifiable).
*   **Clinician Reference Line (Target Baseline):** 110 mg/dL.
*   **Hyperglycemic Threshold Index:** 140 mg/dL.

### 22.2 Latent State Activation Rules
Latent state activation rules and thresholds are summarized in Table 28.1 and Table 28.2.

| Metric / Trend | Threshold | Logic Result |
| :--- | :--- | :--- |
| **Slope (Recent Trends)** | \(\ge 1.2\) | Velocity trend is `up` |
| **Slope (Recent Trends)** | \(\le -1.2\) | Velocity trend is `down` |
| **Slope (Recent Trends)** | Else | Velocity trend is `flat` |
| **RMSE Volatility** | \(&gt; 25\) | Volatility trend is `up` |
| **RMSE Volatility** | \(&lt; 15\) | Volatility trend is `down` |
| **Fasting Average (\(\mu\))**| \(> 130\) | BDI trend is `up` |
| **Fasting Average (\(\mu\))**| \(< 90\) | BDI trend is `down` |
| **CBI Raw Score** | \(> 40\) | Cumulative Burden trend is `up` |
| **CBI Raw Score** | \(< 15\) | Cumulative Burden trend is `down` |

*Table 28.1: Metric Score and Trend Calibration Thresholds*

| Latent State ID | Algebraic Score Formula | Activation Gates |
| :--- | :--- | :--- |
| **SD** | \(\text{clamp}(CBI_{raw} \cdot 0.6 + VI_{raw} \cdot 0.1 + (100 - VOL_{raw}) \cdot 0.3 \cdot M_{sd}, 0, 100)\) | Slope is `up` OR \(VI_{raw} > 40\); \(SCI_{raw} > 60\); Span \(\ge 5\) Days |
| **FR** | If Eligible: \(\text{clamp}(VOL_{raw} \cdot 0.7 + BDI_{raw} \cdot 0.3, 0, 100)\); Else: \(\le 15\) | Drop: \(\mu_{1st} - \mu_{2nd} > 15\) OR \(Max_{1st} - Min_{2nd} > 25\); Volatile: \(VOL_{raw} > 28\) OR (Slope \(&gt; 0.5\) AND \(BDI_{raw} > 20\)) |
| **CB** | \(\text{clamp}(BDI_{raw} \cdot 0.5 + CBI_{raw} \cdot 0.5, 0, 100)\) | Fasting Average \(\mu > 130\); Span \(\ge 5\) Days |
| **HV** | \(\text{clamp}(VOL_{raw} \cdot 0.8 + AI_{raw} \cdot 0.2, 0, 100)\) | Volatility \(RMSE > 25\) |
| **RD** | If Eligible: \(\text{clamp}(RD_{base} \cdot M_{rd}, 0, 100)\); Else: \(\le 15\) | Genuine Recovery: (Slope \(< -0.8\) OR RegSlope \(< -0.2\)) AND (\(VI_{raw} < 45\) OR VI trend is `down`) AND CBI trend is not `up` |
| **TC** | \(\text{clamp}((BDI_{raw} \cdot 0.4 + VOL_{raw} \cdot 0.4 + M_{tc}) \cdot M_{tc\_factor}, 0, 100)\) | Convergence: \(|BDI_{raw} - VOL_{raw}| < 10\) AND \(BDI_{raw} > 10\) |
| **TNR** | If Intervention: \(\text{clamp}(CB_{score} \cdot 0.6 + BDI_{raw} \cdot 0.15 + M_{trend}, 40, 65)\); Else: \(\le 15\) | Chronic Hyperglycemic: Intervention = `true` AND \(CB_{score} > 40\) AND \(BDI_{raw} > 30\) AND \(CBI_{raw} > 30\) AND RegSlope \(\ge -0.2\) |
| **SC** | \(SCI_{raw}\) | Telemetry Completeness ratio \(> 0\) |

*Table 28.2: Latent State Gating and Algebraic Formulas*

### 22.3 Latent State Lifecycle Evolution Rules
Lifecycle status is determined by comparing current score \(S_{curr}\), historical score \(S_{prev}\), and the velocity trend:
*   **Resolved:** \(S_{curr} < 15\) and \(S_{prev} \ge 20\).
*   **Emerging:** \(S_{curr} < 35\) and \(S_{curr} > S_{prev} + 5\).
*   **Escalating:** \(S_{curr} > 65\) and (\(S_{curr} > S_{prev} + 5\) or trend is `up`).
*   **Decaying:** \(S_{curr} < S_{prev} - 5\).
*   **Active:** \(S_{curr} \ge 35\) and does not meet other criteria.
*   **Stable:** Default state.

### 22.4 Composite State Gating & Activation Rules
Composite states evaluate interactions between multiple active latent profiles. Rules are detailed in Table 28.3.

| Composite State Name | Status Value | Logic Rules / Triggers |
| :--- | :--- | :--- |
| **Chronic Crisis** | `Active` | \(CB_{score} > 50\) AND \(SD_{score} > 40\) AND \(HV_{score} > 40\) AND Span \(\ge 14\) Days AND (Slope trend is `up` OR \(VI_{raw} > 45\)) |
| **Hidden Escalation** | `Active` | \(SD_{score} > 45\) AND \(SCI_{raw} > 65\) AND \(HV_{score} < 32\) AND (Slope trend is `up` OR \(VI_{raw} \ge 48\)) AND (\(AI_{raw} \ge 40\) AND \(AI_{raw} \le 65\)) |
| **Refractory Deterioration** | `Active` | \(SD_{score} > 40\) AND \(TNR_{score} > 40\) AND Slope trend is `up` AND RegSlope \(> 0.1\) AND \(HV_{score} < 45\) |
| **Unstable Plateau** | `Active` | \(CB_{score} > 50\) AND \(HV_{score} > 50\) AND (Slope trend is `flat` OR \(|Slope| < 1.0\)) |
| **Emerging Crisis** | `Active` / `Escalating` | Constituent States Met: \(SD_{score} \ge 35\) AND \(HV_{score} \ge 35\); Gating Parameters Met: Persistence days \(\ge 3.0\) AND Interaction strength \(\ge 0.50\) |
| **Emerging Crisis** | `Candidate` | Constituent States Met: \(SD_{score} \ge 35\) AND \(HV_{score} \ge 35\); Gating Parameters Bypassed: Persistence days \(< 3.0\) OR Interaction strength \(< 0.50\) |
| **Emerging Crisis** | `Emerging` | Pre-Crisis: Only one latent state active (\(SD_{score} \ge 35\) OR \(HV_{score} \ge 35\)) |
| **Emerging Crisis** | `Inactive` | Default: Neither constituent state is active. |

*Table 28.3: Composite State Activation Gates and Logic Rules*

### 22.5 Synthesized Risk Tier Mapping Rules
The final risk score is mapped to risk tiers as detailed in Table 28.4.

| Risk Score Range | Synthesized Risk Tier |
| :---: | :--- |
| \(> 75\) | Critical |
| \(56 \text{ to } 75\) | High |
| \(36 \text{ to } 55\) | Moderate |
| \(16 \text{ to } 35\) | Low |
| \(\le 15\) | Minimal |

*Table 28.4: Risk Score Tier Mapping Ranges*

### 22.6 Risk Trend Engine Rules
Risk trends are determined by comparing long-term slope (\(L_{slope}\)) and short-term slope (\(S_{slope}\)):
*   **Rapid Deterioration:** \(L_{slope} > 0.8\) AND (\(L_{slope} > 2.0\) OR \(S_{slope} > 1.8\)).
*   **Worsening:**
    *   \(L_{slope} > 0.8\) and \(S_{slope} \le 1.8\) and (\(L_{slope} > 1.2\) or \(S_{slope} > 1.0\)).
    *   \(L_{slope} < -0.8\) and \(S_{slope} > 1.5\) (rebound deterioration).
    *   \(|L_{slope}| \le 0.8\) and \(S_{slope} > 1.8\).
*   **Slow Deterioration:** \(L_{slope} > 0.8\) and does not meet other criteria.
*   **Improving:**
    *   \(L_{slope} < -0.8\) and \(S_{slope} < -1.5\).
    *   \(|L_{slope}| \le 0.8\) and \(S_{slope} < -1.8\).
*   **Stable:** Default state.

### 22.7 Clinician Recommendation Selection Logic
Recommendations are generated dynamically based on active composite states and latent indices:
*   **Active Emerging Crisis:**
    *   *Primary:* Increase Monitoring Frequency (Confidence: High)
    *   *Secondary:* Initiate Continuous Sensor (CGM) Assessment (Confidence: High)
    *   *Supporting:* Perform Regimen Sensitivity Audit (Confidence: Moderate)
*   **Chronic Burden (> 50) without Emerging Crisis:**
    *   *Primary:* Establish Structured Nutritional Counseling (Confidence: Very High)
    *   *Secondary:* Review Basal Dose Titration (Confidence: High)
    *   *Supporting:* Schedule Diagnostic Assay Check (Confidence: High)
*   **False Recovery (> 40) without Emerging Crisis / Chronic Burden:**
    *   *Primary:* Exercise Caution with Therapy Reductions (Confidence: High)
    *   *Secondary:* Conduct Postprandial Challenge Test (Confidence: Moderate)
    *   *Supporting:* Validate Self-Monitoring Device Accuracy (Confidence: High)
*   **Stable (Default):**
    *   *Primary:* Maintain Current Therapeutic Regimen (Confidence: High)
    *   *Secondary:* Continue Weekly Logbook Reviews (Confidence: Moderate)
    *   *Supporting:* Routine Physical Activity Strategy Review (Confidence: High)

### 22.8 Urgent Action Overrides (Critical Risk Tier)
If the final risk tier is **Critical** (\(Risk_{score} \ge 76\)), the engine prepends urgent recommendations:
*   *Consultation:* "Immediate Specialist Consultation" (Always added).
*   *Sensor:* "Continuous Telemetry Sensor Deployment" (Added if \(HV_{score} > 45\) or composite is Emerging/Chronic Crisis).
*   *Therapeutic:* "Immediate Medication Review" (Added if \(TNR_{score} > 40\) or composite is Refractory Deterioration).
*   *Assessment:* "Emergency Metabolic Assessment" (Added if composite is Chronic Crisis or \(SD_{score} > 75\)).
*   *Referral:* "Inpatient Referral (when deterioration persists)" (Added if \(Risk_{score} > 90\)).

---

## 29. STATE INVENTORY

### 29.1 Glycemic Metrics States
*   **VI (Velocity Index):** Raw rate of change of glycemic values.
*   **AI (Acceleration Index):** Rate of change of glycemic velocity.
*   **VOL (Volatility Index):** Residual glycemic fluctuations (RMSE).
*   **BDI (Baseline Deviation Index):** Average distance from fasting targets.
*   **CBI (Cumulative Burden Index):** Cumulative hyperglycemic area exposure.
*   **SCI (State Confidence Index):** Telemetry data completeness and density.

### 29.2 Latent Clinical States
Latent clinical states are listed in Table 29.1.

| State Name | State ID | Input Parameters | Output Values | Primary Dependencies |
| :--- | :---: | :--- | :--- | :--- |
| **Silent Deterioration** | `sd` | CBI, VI, VOL | Score, Severity, status, reasoning tree | `cbi`, `vi`, `vol` |
| **False Recovery** | `fr` | VOL, BDI, split averages | Score, Severity, status, evidence narrative | `vol`, `bdi`, split values |
| **Chronic Burden** | `cb` | BDI, CBI | Score, Severity, status, evidence narrative | `bdi`, `cbi` |
| **High Variability** | `hv` | VOL, AI | Score, Severity, status, lifecycle | `vol`, `ai` |
| **Recovery Deceleration** | `rd` | VI, CBI, RegSlope | Score, Severity, status, evidence narrative | `vi`, `cbi`, `regSlope` |
| **Threshold Convergence** | `tc` | BDI, VOL | Score, Severity, status, coupling index | `bdi`, `vol` |
| **Treatment Non-Responders**| `tnr`| CB, BDI, CBI, Intervention | Score, Severity, status, audit reports | `cb`, `bdi`, `hasIntervention` |
| **State Confidence** | `sc` | SCI | Score, Confidence level, lifecycle | `sci` |

*Table 29.1: Latent State Identifiers and Clinical Roles*

### 29.3 Composite Crisis States
Composite crisis states are detailed in Table 29.2.

| Composite Name | Input Criteria | Output Parameters | Dependency Layer |
| :--- | :--- | :--- | :--- |
| **Emerging Crisis** | \(SD \ge 35\) AND \(HV \ge 35\); days \(\ge 3.0\); strength \(\ge 0.50\) | Score, Status (`Active` / `Escalating`), severity, narrative | `sd`, `hv`, persistence days, interaction strength |
| **Chronic Crisis** | \(CB > 50\) AND \(SD > 40\) AND \(HV > 40\); days \(\ge 14\); slope is `up` | Score, Status (`Active`), severity, narrative | `cb`, `sd`, `hv`, chronicity timer, velocity trend |
| **Hidden Escalation** | \(SD > 45\) AND \(SCI > 65\) AND \(HV < 32\); slope is `up`; \(AI \in [40, 65]\) | Score, Status (`Active`), severity, narrative | `sd`, `sci`, `hv`, velocity trend, acceleration range |
| **Refractory Deterioration**| \(SD > 40\) AND \(TNR > 40\); slope is `up`; \(HV < 45\) | Score, Status (`Active`), severity, narrative | `sd`, `tnr`, velocity trend, volatility ceiling |
| **Unstable Plateau** | \(CB > 50\) AND \(HV > 50\); slope is `flat` | Score, Status (`Active`), severity, narrative | `cb`, `hv`, trend velocity |

*Table 29.2: Composite State Identifiers and Criteria*

### 29.4 Risk Classification States
*   **Minimal:** Score \(\le 15\). No active composite stress.
*   **Low:** Score \(16 \text{ to } 35\). Minor baseline deviations.
*   **Moderate:** Score \(36 \text{ to } 55\). Moderate fluctuations.
*   **High:** Score \(56 \text{ to } 75\). Active latent disease states.
*   **Critical:** Score \(\ge 76\). Active composite crisis conditions.

### 29.5 Clinician Recommendation Classes
*   **URGENT:** Time-critical actions for high-risk profiles.
*   **PRIMARY:** Direct interventions targeted at active composite states.
*   **SECONDARY:** Secondary checks and monitoring adjustments.
*   **SUPPORTING:** Diagnostic assays and routine evaluations.

---

## 30. ALGORITHM INVENTORY

### 30.1 Least Squares Linear Regression Slope Fit
*   **Purpose:** Fits a linear model (\(y = mx + c\)) to glycemic values to evaluate trend directions.
*   **Inputs:** Numeric indices (independent variables), glucose values (dependent variables).
*   **Outputs:** Regression slope (\(m\)), intercept (\(c\)).
*   **Implementation Location:** `src/lib/api.ts#L100-115`.

### 30.2 Markov Trajectory Probability Allocation
*   **Purpose:** Calculates pathway transition probabilities based on volatility and baseline thresholds.
*   **Inputs:** Raw metrics and risk tiers.
*   **Outputs:** Probability scores for Decline (\(P_A\)), Maintenance (\(P_B\)), and Recovery (\(P_C\)).
*   **Mathematical Boundary:**
    \[P_A + P_B + P_C = 100\]
*   **Implementation Location:** `src/lib/predictionEngine.ts#L319-381`.

### 30.3 Digital Twin Scenario Modeling & Multipliers
*   **Purpose:** Simulates patient glycemic parameters under hypothetical interventions.
*   **Inputs:** Baseline analysis results, modifier parameters.
*   **Outputs:** Modified metrics, updated latent states, and overall utility scores.
*   **Implementation Location:** `src/lib/predictionEngine.ts#L114-298`.

### 30.4 Validation Engine Compliance Grading
*   **Purpose:** Evaluates engine outputs against clinical rule constraints.
*   **Inputs:** Analysis outputs, predictions, patient record, raw telemetry.
*   **Outputs:** Compliance score (0-100%) and validation status.
*   **Compliance Formula:**
    \[Compliance = \frac{\text{Passed Checks}}{\text{Total Checks}} \times 100\]
*   **Implementation Location:** `src/lib/clinicalRuleValidator.ts#L739-899`.

---

## 31. EXPLAINABILITY INVENTORY

### 31.1 Dynamic Clinical Narrative Summarizer
*   **Purpose:** Generates readable case summaries summarizing observation spans, active composite states, risk levels, and recommendations.
*   **Implementation Location:** `src/lib/api.ts#L1679-1710`.

### 31.2 Intermediate Calculation & Gating Traceability
*   **Purpose:** Exposes calculations and logic gates to the explainability explorer.
*   **Implementation Location:** `src/lib/api.ts#L483-500` (`clinicalInputs`, `intermediateCalculations`, `activationGates`, `persistenceGates`).

### 31.3 Telemetry Gaps & Limitations Logger
*   **Purpose:** Logs limitations such as short observation windows or low data density.
*   **Implementation Location:** `src/lib/api.ts#L1001-1023`.

---

## 32. DIGITAL TWIN INVENTORY

### 32.1 Intervention Scenarios
Digital twin scenarios and their corresponding parameters are detailed in Table 26.1.

| Scenario ID | Intervention Name | Modifier Parameters | Expected Physiological Effect |
| :---: | :--- | :--- | :--- |
| **A** | Current Treatment | None | Baseline trajectory continues unchanged. |
| **B** | Increase Monitoring | \(SCI_{raw} + 15\) | Higher telemetry data confidence, earlier warning times. |
| **C** | Reduce Volatility | \(VOL_{raw} \times 0.8\) | Dampens glycemic swings and postprandial spikes. |
| **D** | Reduce Deviation | \(BDI_{raw} \times 0.85\); \(CBI_{raw} \times 0.90\) | Lowers average fasting glucose and chronic burden. |

*Table 26.1: Digital Twin Simulation Multiplier Scenarios*

### 32.2 Scenario Evaluation & Ranking System
*   **Overall Score Formula:**
    \[Utility = R \times 0.35 + C \times 0.15 + T \times 0.20 + S \times 0.15 + P \times 0.15\]
*   **Ranking:** Interventions are sorted in descending order of utility score (excluding Scenario A).
*   **Badges:** Rank 1: `BEST SCENARIO`, Rank 2: `RECOMMENDED ALTERNATIVE`, Rank 3: `SUPPORTING ACTION`.
*   **Implementation Location:** `src/lib/predictionEngine.ts#L688-796`.

---

## 33. VALIDATION INVENTORY

The clinical rule validator audits data consistency across an 8-layer framework as depicted in Figure 33.1:

```
                  +-----------------------------------+
                  |      Telemetry Input Stream       |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |      1. Metric Layer Audit        |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |      2. Latent State Audit        |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |      3. Composite State Audit     |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |      4. Risk Assessment Audit     |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |     5. Recommendation Audit       |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |      6. Prediction Layer Audit    |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |      7. Digital Twin Audit        |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |     8. Explainability Audit       |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |   Validation Report Output &      |
                  |     Stress Test Diagnostics       |
                  +-----------------------------------+
```
*Figure 33.1: 8-Layer Clinical Rule Validator and Stress Test Loop*

### 33.1 Eight-Layer Consistency Check Structure
*   **1. Metric Layer:** Verifies that raw metrics are within expected ranges (\(0-100\)) and free of invalid numeric types (NaN, Infinity).
*   **2. Latent State Layer:** Audits active states against activation gates and verifies that score magnitudes correspond to correct severity tiers.
*   **3. Composite State Layer:** Ensures active composite states satisfy constituent latent state criteria (e.g. Emerging Crisis requires both SD and HV).
*   **4. Risk Layer:** Validates risk score calculations and risk tier classifications.
*   **5. Recommendation Layer:** Verifies that recommended clinical actions align with the patient's risk tier.
*   **6. Prediction Layer:** Confirms that pathway transition probabilities sum to exactly \(100\%\).
*   **7. Digital Twin Layer:** Audits simulated predictions and utility scores for logical consistency.
*   **8. Explainability Layer:** Audits clinical narratives and ensures limitations are logged appropriately.

### 33.2 Validation Severity Outputs
*   **PASS:** Compliance score \(\ge 95\%\), no logic errors.
*   **WARNING:** Minor issues (e.g., candidate composite status or low data density).
*   **FAIL:** Major consistency violations (e.g., active composite state with unmet gates).

### 33.3 Automated Stress Testing System
The validator stress tests the system by sequentially seeding and auditing all 10 clinical profiles. If a profile encounters a logic error (validation status `FAIL`), the stress test fails, and the system is marked as not "Patent Ready".

---

## 34. API INVENTORY

### 34.1 Endpoint Specification
*   **Endpoint:** `/api/analyze`
    *   *Method:* POST
    *   *Payload:* `{ measurements: Measurement[], window_days: number | null }`
    *   *Response Type:* `AnalysisResult`
*   **Endpoint:** `/api/upload-csv`
    *   *Method:* POST
    *   *Payload:* Multi-part FormData containing a CSV file.
    *   *Response Type:* `{ measurements: Measurement[] }`

### 34.2 Offline Fallback Processing Handler
If the API endpoints are unreachable, the client redirects processing to local functions:
*   `analyzeGlucose` falls back to `generateLocalAnalysis` ([api.ts:L1975-1979](file:///e:/1-Summer%20Internship/Patent%20Frontend/src/lib/api.ts#L1975-1979)).
*   `uploadCsvApi` falls back to a client-side CSV parser ([api.ts:L2001-2018](file:///e:/1-Summer%20Internship/Patent%20Frontend/src/lib/api.ts#L2001-2018)).

---

## 35. DATA MODEL INVENTORY

### 35.1 Zustand Store State & Action Schema
The state properties and actions managed by the central Zustand store are detailed in Table 35.1.

| State / Action Identifier | Type Signature | Purpose |
| :--- | :--- | :--- |
| **patient** | `PatientRecord \| null` | Demographic details of the selected patient. |
| **measurements** | `Measurement[]` | Time-series array of glycemic readings. |
| **analysis** | `AnalysisResult \| null` | Computed indices, states, and risk levels. |
| **timeline** | `TimelineNode[]` | Evolution path nodes. |
| **crceReport** | `CRCEValidationReport \| null` | Validator report. |
| **stressTestSummary** | `StressTestSummary \| null` | Stress test diagnostics. |
| **selectedWindow** | `number \| null` | Active range window (7, 14, 30, 90 days, or All). |
| **isLoading** | `boolean` | Indicates active background calculations. |
| **error** | `string \| null` | Holds error messages. |
| **units** | `'mg/dL' \| 'mmol/L'` | Active unit preference. |
| **targetMin / targetMax** | `number` | Fasting target range boundaries. |
| **setPatient** | `(patient: PatientRecord) => void` | Sets the active patient record. |
| **setMeasurements** | `(measurements: Measurement[]) => void` | Replaces the measurements array. |
| **runStressTest** | `() => void` | Initiates the 10-scenario validation test suite. |

*Table 35.1: Zustand Store Interface Action List*

### 35.2 Logic Module Interface Schemas
```typescript
export interface PatientRecord {
  name: string;
  dob: string;
  age: number;
  patientId: string;
}

export interface Measurement {
  date: string; 
  glucose: number; 
  source: 'manual' | 'csv_upload' | 'system';
  medication?: string;
  intervention?: string;
}

export interface MetricDetail {
  raw: number;
  normalized: number;
  confidence: number;
  trend: 'up' | 'down' | 'flat';
}

export interface MetricsOutput {
  vi: MetricDetail;
  ai: MetricDetail;
  vol: MetricDetail;
  bdi: MetricDetail;
  cbi: MetricDetail;
  sci: MetricDetail;
}

export interface LatentStateContribution {
  name: string;
  value: number;
}

export interface LatentStateGate {
  name: string;
  met: boolean;
}

export interface LatentStateDetail {
  score: number;
  confidence: number;
  severity: 'Normal' | 'Moderate' | 'High' | 'Severe' | 'Low Confidence' | 'Moderate Confidence' | 'High Confidence' | 'Very High Confidence';
  status: string; 
  evidence: string[];
  contributions: LatentStateContribution[];
  gates: LatentStateGate[];
  limitingFactors: string[];
  reasoningTree: string[];
  reasoningNarrative: string;
  clinicalInputs?: { name: string; value: string | number }[];
  intermediateCalculations?: { name: string; value: string | number }[];
  rawScore?: number;
  activationGates?: { name: string; met: boolean }[];
  persistenceGates?: { name: string; met: boolean }[];
  confidenceAdjustment?: string;
  finalScore?: number;
}

export interface LatentStatesOutput {
  sd: LatentStateDetail;
  fr: LatentStateDetail;
  cb: LatentStateDetail;
  hv: LatentStateDetail;
  rd?: LatentStateDetail;
  tc?: LatentStateDetail;
  tnr?: LatentStateDetail;
  sc?: LatentStateDetail;
}

export interface RecommendationDetail {
  type: 'URGENT' | 'PRIMARY' | 'SECONDARY' | 'SUPPORTING';
  title: string;
  confidence: 'Low' | 'Moderate' | 'High' | 'Very High';
  benefit: string;
  source: string;
  activatedLatentState?: string;
  activatedCompositeState?: string;
  dominantMetric?: string;
  physiologicalEffect?: string;
}

export interface CompositeStateOutput {
  name: string;
  score: number;
  confidence: number;
  severity: 'Normal' | 'Moderate' | 'High' | 'Severe';
  status: 'Inactive' | 'Candidate' | 'Emerging' | 'Active' | 'Escalating' | 'Stable' | 'Decaying' | 'Resolved';
  contributingStates: { name: string; score: number }[];
  interactionStrength: number;
  persistenceDays: number;
  reasoningNarrative: string;
  gates: LatentStateGate[];
}

export interface RiskOutput {
  score: number;
  confidence: number;
  tier: 'Minimal' | 'Low' | 'Moderate' | 'High' | 'Critical';
  trend: string;
  drivers: string[];
  amplifiers: string[];
  reducers: string[];
}

export interface ExplainabilityOutput {
  summary: string;
  drivers: string[];
  limitations: string[];
}

export interface ReasoningConfidence {
  stateConfidence: number;
  compositeConfidence: number;
  riskConfidence: number;
  recommendationConfidence: number;
}

export interface ConsistencyCheckNode {
  status: 'PASS' | 'WARNING' | 'FAIL';
  name: string;
  message: string;
}

export interface ConsistencyValidationReport {
  overallPassed: boolean;
  checks: {
    stateCheck: ConsistencyCheckNode;
    compositeCheck: ConsistencyCheckNode;
    riskCheck: ConsistencyCheckNode;
    recommendationCheck: ConsistencyCheckNode;
  };
  warnings: string[];
}

export interface TimelineNode {
  day: number;
  date: string;
  states: string[];
  description: string;
}

export interface AnalysisResult {
  window: {
    measurementCount: number;
    totalDays: number;
    dataQuality: 'high' | 'moderate' | 'low';
  };
  metrics: MetricsOutput;
  states: LatentStatesOutput;
  compositeState: CompositeStateOutput;
  risk: RiskOutput;
  explainability: ExplainabilityOutput;
  recommendations: RecommendationDetail[];
  reasoningConfidence: ReasoningConfidence;
  consistencyReport: ConsistencyValidationReport;
}

export interface StressTestSummary {
  scenariosPassed: number;
  averageCompliance: number;
  averageConfidence: number;
  averageRuntimeMs: number;
  totalWarnings: number;
  totalErrors: number;
  patentReady: 'YES' | 'NO';
}

export interface CRCEValidationNode {
  status: 'PASS' | 'WARNING' | 'FAIL';
  compliance: number;
  reason: string;
  errors: string[];
  warnings: string[];
}

export interface CRCEAuditEntry {
  timestamp: string;
  module: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  reason: string;
  durationMs: number;
}

export interface CRCEValidationReport {
  overallStatus: 'PASS' | 'WARNING' | 'FAIL';
  overallCompliance: number; 
  validationResults: {
    metrics: CRCEValidationNode;
    latents: CRCEValidationNode;
    composites: CRCEValidationNode;
    risk: CRCEValidationNode;
    recommendations: CRCEValidationNode;
    predictions: CRCEValidationNode;
    digitalTwin: CRCEValidationNode;
    explainability: CRCEValidationNode;
  };
  warnings: { module: string; message: string; observed?: any; expected?: any; fix?: string }[];
  errors: { module: string; message: string; observed?: any; expected?: any; fix?: string }[];
  auditLog: CRCEAuditEntry[];
}
```

---

## 36. DEPENDENCY GRAPH

### 36.1 Textual Module Interdependency Diagram
The structural coupling and importing directions between codebase modules are mapped in Figure 36.1:

```
       +---------------------------------------------+
       |               useTCREStore.ts               |
       |  (Centralizes global state and controls)    |
       +---------+--------------------+--------------+
                 |                    |
                 | imports            | imports
                 v                    v
       +---------+-------+    +-------+--------------+
       |     api.ts      |    |  predictionEngine.ts |
       | (Local calculations)|   |  (Markov & Twin sims)|
       +---------+-------+    +-------+--------------+
                 |                    |
                 v imports            v imports
       +---------+--------------------+--------------+
       |                mathUtils.ts                 |
       |     (Clamps, safe division boundaries)      |
       +---------------------------------------------+

       +---------------------------------------------+
       |          clinicalRuleValidator.ts           |
       |      (Audits api & prediction outputs)      |
       +---------+--------------------+--------------+
                 |                    |
                 v imports            v imports
       +---------+-------+    +-------+--------------+
       |   useTCREStore  |    |  predictionEngine.ts |
       +-----------------+    +----------------------+
```
*Figure 36.1: Code Module Coupling and Interdependency Graph*

---

## 37. FUTURE ARCHITECTURE ROADMAP

### 37.1 Biomarker and Deployment Extensibility Roadmap
Figure 37.1 outlines the roadmap for extending TCRE from a single-biomarker dashboard to a generalized multi-biomarker clinical reasoning system deployed across hospital networks.

```
+------------------------------------------------------------------------+
|                      1. SINGLE-BIOMARKER ENGINE                        |
|  Current state: Fasting blood glucose tracking, local calculations,    |
|  and client-side visual indicators.                                    |
+-----------------------------------+------------------------------------+
                                    |
                                    v (Extend metric adapters)
+-----------------------------------+------------------------------------+
|                         2. MULTI-ORGAN BIOMARKERS                  |
|  Integrate liver function (ALT/AST), kidney function (eGFR/Creatinine),|
|  cardiac parameters (Troponin/NT-proBNP), and inflammatory markers.    |
+-----------------------------------+------------------------------------+
                                    |
                                    v (Integrate secure communication)
+-----------------------------------+------------------------------------+
|                       3. ENTERPRISE CLINICAL APPS                  |
|  Deploy secure REST APIs, user authentication, and databases.          |
+-----------------------------------+------------------------------------+
                                    |
                                    v (Integrate live sensor sync)
+-----------------------------------+------------------------------------+
|                    4. WEARABLE & ICU TELEMETRY SYNC                |
|  Live synchronization with wearable sensors and patient monitors      |
|  in intensive care units (ICU).                                        |
+-----------------------------------+------------------------------------+
                                    |
                                    v (EHR Integration)
+-----------------------------------+------------------------------------+
|                       5. GENERALIZED CLINICAL ENGINE               |
|  Interoperable clinical reasoning engine integrated with hospital EHRs|
|  and remote monitoring networks.                                       |
+------------------------------------------------------------------------+
```
*Figure 37.1: Extensible Biomarker Reasoning & Deployment Roadmap*

---

## 38. APPENDIX A: COMPLETE GLOSSARY OF ABBREVIATIONS

*   **TCRE (Temporal Clinical Reasoning Engine):** The core clinical reasoning engine that processes time-series physiological biomarker telemetry. Used as the main reasoning pipeline.
*   **EITS (Engineering Invention Technical Specification):** The master documentation suite detailing the TCRE software architecture, algorithms, and modules.
*   **VI (Velocity Index):** The rate-of-change of physiological telemetry averages, evaluating short-term trend slopes. Used to track trajectory creep.
*   **AI (Acceleration Index):** The rate-of-change of velocity, indicating whether a trajectory shift is worsening or stabilizing. Used to identify sudden baseline shifts.
*   **VOL (Volatility Index):** The standard deviation of linear regression residuals (RMSE). Used to measure short-term glycemic fluctuations independent of overall trends.
*   **BDI (Baseline Deviation Index):** The normalized deviation of a patient's average readings from the baseline target (\(110\) mg/dL). Used to assess chronic offset.
*   **CBI (Cumulative Burden Index):** The integral of glycemic values exceeding safe clinical thresholds (\(140\) mg/dL). Used to quantify cumulative tissue-level burden.
*   **SCI (State Confidence Index):** A metric evaluating telemetry data completeness and frequency. Used to assess data quality and calibrate engine confidence.
*   **SD (Silent Deterioration):** A latent clinical state characterized by a creeping baseline rise masked by low volatility. Used to detect creeping complications.
*   **FR (False Recovery):** A latent state where a temporary drop in readings mimics recovery while background volatility remains elevated. Used to prevent premature treatment de-escalation.
*   **CB (Chronic Burden):** A latent state representing sustained baseline elevations. Used to assess long-term metabolic strain.
*   **HV (High Variability):** A latent state representing rapid spikes and crashes. Used to identify patients exposed to acute glycemic instability.
*   **RD (Recovery Deceleration):** A latent state indicating a downward trajectory that is beginning to flatten. Used to monitor stabilization phases.
*   **TC (Threshold Convergence):** A latent state indicating convergence of the baseline deviation and volatility indices. Used to evaluate stability.
*   **TNR (Treatment Non-Responsiveness):** A latent state identifying patients who do not respond to therapeutic interventions. Used to flag treatment resistance.
*   **SC (State Confidence):** A latent state mapping the overall completeness of the input telemetry. Used to track data quality.
*   **CRCE (Clinical Rule Consistency Engine):** The 8-layer validator that checks TCRE outputs for logical and mathematical consistency.
*   **RMSE (Root Mean Square Error):** A statistical metric calculating the standard deviation of residuals. Used to evaluate volatility independent of trends.
*   **Markov:** A mathematical model representing state transitions. Used to calculate trajectory transition probabilities.
*   **Digital Twin:** A simulated model of the patient's physiology. Used to predict responses to hypothetical adjustments.
*   **Explainability:** The features and traces that expose how TCRE indices and states are computed, providing visibility into the decision-making process.
*   **Composite State:** A high-order clinical state synthesized by evaluating interactions between multiple active latent profiles.
*   **Latent State:** An underlying clinical indicator evaluated by processing metrics against Boolean gating rules.
*   **Recommendation Engine:** The module that generates clinical recommendations based on active states and risk levels.
*   **Risk Engine:** The module that calculates a synthetic risk score and maps it to a risk tier.
*   **Prediction Engine:** The module that generates Markov transition probabilities and recommendation forecasts.
*   **Validation Engine:** The module that checks TCRE outputs for consistency and compliance.

---

## 39. APPENDIX B: DOCUMENTATION GAP ANALYSIS

### 39.1 Subsystem Documentation Status & Priority Grid
Documentation gaps are analyzed in Table 39.1 to establish priorities for future chapters of the specification.

| Subsystem Name | Existing Documentation | Missing Documentation | Documentation Priority | Proposed Future Chapter | Completion Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Core Calculations** | None | Multi-day regression fits, RMSE algorithms, index scales. | **High** | Chapter 2: Index Engine | Pending |
| **Latent State Rules**| Inline comments | Gate parameters, lifecycle thresholds, evidence generation. | **High** | Chapter 3: Latent Logic | Pending |
| **Composite State Synthesis**| Inline comments | Interaction formulas, chronicity gates, candidate status. | **High** | Chapter 4: Composite State | Pending |
| **Risk Assessment** | Inline comments | Weighted averages, amplifiers, reducers, trends. | **Medium** | Chapter 5: Risk Engine | Pending |
| **Digital Twin Simulator**| Inline comments | Intervention multipliers, utility score formulas. | **Medium** | Chapter 6: Twin Simulation | Pending |
| **8-Layer Validator** | Inline comments | Consistency check rules, stress testing algorithms. | **High** | Chapter 7: Verification | Pending |
| **Explainability Engine**| None | Explainability structures, narrative templates. | **Low** | Chapter 8: Explainability | Pending |
| **REST API** | None | Route descriptions, parameter tables, fallback logic. | **Medium** | Chapter 9: Interface Spec | Pending |

*Table 39.1: Architectural Documentation Gap Analysis Grid*
