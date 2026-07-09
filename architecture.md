# StadiumMind AI - Systems Architecture

This document describes the systems, components, event flows, and deployment architectures for **StadiumMind AI**. The platform is built on Google Cloud Platform (GCP) and uses a multi-agent generative AI structure.

---

## 1. High-Level System Architecture

The solution uses a serverless, event-driven architecture to scale to millions of concurrent fans and thousands of operations staff.

```mermaid
graph TD
    %% Clients
    subgraph Clients [Client Tier]
        FanApp[Mobile App: Fans]
        VolApp[Mobile App: Volunteers]
        OpsDesk[Command Center Web App]
    end

    %% API Gateway & Traffic Management
    subgraph Edge [Edge & Security Tier]
        CDN[Cloud CDN]
        Armor[Cloud Armor WAF]
        LB[HTTPS Load Balancer]
        Auth[Firebase Auth]
    end

    %% Application Tier
    subgraph Application [Application & Microservices Tier]
        API[Cloud Run: REST Gateway]
        Ingest[Cloud Run: IoT/CCTV Ingestion]
        Orchestration[Cloud Run: Multi-Agent Orchestrator]
    end

    %% Event Broker & Streaming
    subgraph Pipeline [Streaming & Telemetry Tier]
        PubSub[Cloud Pub/Sub]
        Dataflow[Cloud Dataflow]
    end

    %% Database & Storage
    subgraph Database [Database & Storage Tier]
        Firestore[Cloud Firestore: Real-time Data]
        BigQuery[BigQuery: Analytics & Data Warehousing]
        Storage[Cloud Storage: Video & Logs]
    end

    %% AI & Cognitive Services
    subgraph AIServices [AI & Cognitive Services]
        Vertex[Vertex AI Platform]
        Gemini[Gemini 2.5 Flash / Pro]
        Speech[Speech-to-Text & Text-to-Speech]
        Vision[Vertex AI Vision / CCTV Metadata]
        Translate[Cloud Translation API]
    end

    %% Traffic Connections
    FanApp & VolApp & OpsDesk --> CDN
    CDN --> LB
    Armor -.-> LB
    LB --> API & Ingest
    API & VolApp & FanApp --> Auth

    %% App Logic Connections
    API --> Orchestration
    Orchestration --> Vertex
    Ingest --> PubSub
    PubSub --> Dataflow
    Dataflow --> Firestore
    Dataflow --> BigQuery

    %% AI Connections
    Vertex --> Gemini
    Orchestration --> Speech & Translate & Vision
    Orchestration --> Firestore

    %% Storage Connections
    Ingest --> Storage
```

### Why Google Cloud Serverless?
- **Cloud Run**: Scales to zero and spins up instantly to handle match-day spikes. Trade-off: cold starts are minimized by maintaining a minimum instance count of 1 during matches.
- **Firebase Auth & Firestore**: Real-time listeners enable volunteer updates and incident triggers to push to clients without expensive WebSocket infrastructure management.
- **Cloud Pub/Sub**: Acts as a buffer for millions of events per second from IoT tickets, turnstiles, and beacons.

---

## 2. Component Diagram

```mermaid
graph LR
    subgraph UserInterface [Presentation Layer]
        RouterUI[Smart Navigation View]
        IncidentUI[Incident Report Box]
        CopilotUI[Volunteer Task Queue]
        AdminUI[Digital Twin 2D Map]
    end

    subgraph ServiceLayer [Business Logic Microservices]
        NavigationService[Smart Routing Engine]
        IncidentService[Incident Management Service]
        StaffingService[Staff Allocation & Volunteer dispatch]
        TelemetryService[IoT turnstile & camera aggregator]
    end

    subgraph AIOrchestrator [AI Agent Orchestration]
        AgentManager[Vertex AI Agent Manager]
        NavAgent[Navigation Specialist Agent]
        SafetyAgent[Safety & Emergency Agent]
        TransitAgent[Transport Coordinator Agent]
        Guardrails[Safety Guardrails Validation Engine]
    end

    %% Links
    RouterUI --> NavigationService
    IncidentUI --> IncidentService
    CopilotUI --> StaffingService
    AdminUI --> TelemetryService

    NavigationService & IncidentService & StaffingService --> AgentManager
    AgentManager --> NavAgent & SafetyAgent & TransitAgent
    NavAgent & SafetyAgent & TransitAgent --> Guardrails
```

---

## 3. Data Flow

```mermaid
sequenceDiagram
    autonumber
    participant CCTV as CCTV Camera / Turnstile
    participant Ingest as Cloud Run Ingest API
    participant PubSub as Cloud Pub/Sub
    participant Dataflow as Cloud Dataflow
    participant Firestore as Firestore (Real-Time)
    participant BigQuery as BigQuery (Analytics)
    participant OpsUI as Operations Command Center

    CCTV->>Ingest: Send occupancy metadata (JSON payload)
    Ingest->>PubSub: Publish telemetry event
    PubSub->>Dataflow: Stream payload window
    Dataflow->>Firestore: Upsert live sector count (e.g., Gate 4: 92% density)
    Dataflow->>BigQuery: Append historical record for drift analysis
    Firestore->>OpsUI: Push real-time document update (WebSocket/Reactive listener)
    Note over OpsUI: Dashboard marks Sector Red; triggers alert
```

---

## 4. Multi-Agent AI Workflow

```mermaid
flowchart TD
    %% Entry
    UserPrompt([User Request: Fan or Operations Prompt]) --> Gateway[REST API Gateway]
    Gateway --> GuardCheck{Is prompt safe & valid?}

    %% Guardrails Check
    GuardCheck -- No --> Block[Reject request / Return Safety Warning]
    GuardCheck -- Yes --> Router[Hierarchical Supervisor Agent]

    %% Router routing
    Router --> |Navigation Request| NavAgent[Navigation Agent]
    Router --> |Incident / Emergency| EmergencyAgent[Safety Agent]
    Router --> |Transit Info| TransportAgent[Transport Agent]
    Router --> |Operations / General| OpsAgent[Operations Agent]

    %% Grounding & Retrieval
    NavAgent & EmergencyAgent & TransportAgent & OpsAgent --> RAG[RAG retrieval: Grounding Index / Firestore Docs]

    %% Synthesis
    RAG --> Compile[Synthesis via Gemini 2.5]
    Compile --> DoubleCheck{Dual-LLM Validator}

    %% Double check
    DoubleCheck -- Policy Voilation / Hallucination --> Recompile[Regenerate response / fallback to safety template]
    DoubleCheck -- Approved Output --> Return[Encode output to client and translate via Translation API]

    %% Finish
    Return --> Client([User Dashboard / Audio Feed])
```

---

## 5. Sequence Diagram: Emergency Event Evacuation

The sequence below demonstrates how the system reacts in real time to a reported safety hazard (e.g., structural smoke detection in Sector B).

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Safety Officer
    participant CommandCenter as Command Center UI
    participant IncidentService as Incident Microservice
    participant Gemini as Gemini Safety Agent
    participant PushService as Cloud Messaging Push
    participant FanMobile as Fan Mobile App

    Staff->>CommandCenter: Press "Evacuate Sector B" (Structural Anomaly)
    CommandCenter->>IncidentService: POST /api/v1/incidents/report {type: smoke, location: block_B}
    activate IncidentService
    IncidentService->>Gemini: Trigger Emergency Action Plan Prompt
    activate Gemini
    Gemini-->>IncidentService: Return Evacuation Plan & Multilingual Announcements (JSON)
    deactivate Gemini
    IncidentService->>IncidentService: Update Firestore status to "ACTIVE_EVAC"
    IncidentService->>PushService: Broadcast Push Alerts + Audio Evacuation Routes
    activate PushService
    PushService->>FanMobile: Push Notification & Speech Evacuation Path (Avoid Corridor 3)
    deactivate PushService
    IncidentService-->>CommandCenter: Success (CCTV cameras switch to egress view)
    deactivate IncidentService
```

---

## 6. Deployment Architecture

StadiumMind AI is deployed multi-region to ensure maximum reliability and sub-second latency across all 20 venues.

```mermaid
graph TD
    subgraph DNS [DNS & Edge Routing]
        Route53[Cloud DNS Load Balancing]
    end

    subgraph PrimaryRegion [GCP Region: us-east4 - Primary]
        subgraph PrimaryCompute [Compute & Orchestration]
            GKE_Pri[Cloud Run Core REST APIs]
            Agent_Pri[Cloud Run AI Orchestrator]
        end
        subgraph PrimaryStorage [Storage Tier]
            Firestore_Pri[(Firestore Database - Multi-Region Sync)]
        end
    end

    subgraph SecondaryRegion [GCP Region: us-west1 - Standby/DR]
        subgraph SecCompute [Compute & Orchestration]
            GKE_Sec[Cloud Run Core REST APIs - DR]
            Agent_Sec[Cloud Run AI Orchestrator - DR]
        end
        subgraph SecStorage [Storage Tier]
            Firestore_Sec[(Firestore Database - Replica)]
        end
    end

    Route53 --> |Load Balanced / Latency Routed| GKE_Pri & GKE_Sec
    GKE_Pri --> Agent_Pri
    GKE_Sec --> Agent_Sec
    Agent_Pri --> Firestore_Pri
    Agent_Sec --> Firestore_Sec
    Firestore_Pri <--> |Active-Active Multi-Region Replication| Firestore_Sec
```

### Trade-offs & Decisions
1. **Active-Active vs. Active-Passive**: Firestore supports active-active setups natively across multi-region configurations, ensuring zero database down-time. 
2. **Cloud Armor Defense**: Integrated with Cloud Armor to prevent DDoS and API scraping attacks from fans trying to bot tickets or concession systems.
3. **Regional Failover**: In the event of a total GCP region outage, DNS instantly redirects all API requests to the secondary standby region within 4 seconds.
