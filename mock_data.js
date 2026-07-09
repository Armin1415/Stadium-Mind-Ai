// StadiumMind AI - Mock Telemetry and Event Streams Data

const mockStadiumZones = [
  {
    id: "gate_a_ingress",
    name: "Gate A Ingress & Concourse",
    maxCapacity: 5000,
    currentCount: 4200,
    densityPercentage: 84,
    riskLevel: "warning",
    averageQueueTimeSeconds: 480, // 8 mins
    sensorAggregates: { turnstileRatePerMin: 120, cameraCounts: 4100 }
  },
  {
    id: "gate_b_ingress",
    name: "Gate B General Ingress",
    maxCapacity: 6000,
    currentCount: 2100,
    densityPercentage: 35,
    riskLevel: "safe",
    averageQueueTimeSeconds: 120, // 2 mins
    sensorAggregates: { turnstileRatePerMin: 45, cameraCounts: 2050 }
  },
  {
    id: "gate_c_vip",
    name: "Gate C VIP Entrance & Lounge",
    maxCapacity: 1500,
    currentCount: 1380,
    densityPercentage: 92,
    riskLevel: "critical",
    averageQueueTimeSeconds: 620, // 10.3 mins
    sensorAggregates: { turnstileRatePerMin: 60, cameraCounts: 1350 }
  },
  {
    id: "concourse_west",
    name: "West Food Court Concourse",
    maxCapacity: 8000,
    currentCount: 3200,
    densityPercentage: 40,
    riskLevel: "safe",
    averageQueueTimeSeconds: 180, // 3 mins
    sensorAggregates: { turnstileRatePerMin: 0, cameraCounts: 3120 }
  },
  {
    id: "sector_b_stands",
    name: "Sector B Stands (Stairs 3 & 4)",
    maxCapacity: 12000,
    currentCount: 11400,
    densityPercentage: 95,
    riskLevel: "critical",
    averageQueueTimeSeconds: 540,
    sensorAggregates: { turnstileRatePerMin: 180, cameraCounts: 11200 }
  }
];

const mockVolunteers = [
  {
    id: "vol_1",
    name: "Carlos Mendez",
    status: "available",
    skills: ["first_aid", "translation"],
    spokenLanguages: ["es", "en"],
    rating: 4.9,
    location: "Block 104"
  },
  {
    id: "vol_2",
    name: "Yuki Tanaka",
    status: "busy",
    skills: ["mobility_support", "translation"],
    spokenLanguages: ["ja", "en", "ko"],
    rating: 4.8,
    location: "Elevator West 2"
  },
  {
    id: "vol_3",
    name: "Amara Okoro",
    status: "available",
    skills: ["first_aid", "sensory_support"],
    spokenLanguages: ["en", "ig"],
    rating: 4.95,
    location: "Gate B Info Desk"
  },
  {
    id: "vol_4",
    name: "Pierre Dubois",
    status: "offline",
    skills: ["translation"],
    spokenLanguages: ["fr", "en"],
    rating: 4.6,
    location: "Lounge 3"
  }
];

const mockIncidents = [
  {
    id: "inc_001",
    title: "Broken Escalator E2",
    category: "maintenance",
    severity: "medium",
    status: "reported",
    section: "Sector C Concourse",
    time: "10:14 AM",
    aiActionPlan: "Redirect flow to Stairs 6. Dispatch maintenance team. Alert Nav Agent to avoid Escalator E2."
  },
  {
    id: "inc_002",
    title: "Lost Child",
    category: "missing_person",
    severity: "high",
    status: "dispatching",
    section: "Gate A Fan Zone",
    time: "10:32 AM",
    aiActionPlan: "Broadcast photo to volunteer network. Dispatch Amara Okoro to coordinate at Gate A Info Desk. Alert security exit points."
  },
  {
    id: "inc_003",
    title: "Minor Water Leak",
    category: "maintenance",
    severity: "low",
    status: "resolved",
    section: "Restroom Level 2 South",
    time: "09:45 AM",
    aiActionPlan: "Isolated water valve. Dispatched plumber. Cleanup completed."
  }
];

const mockMatchInfo = {
  matchId: "m_2026_01",
  teamA: "USA",
  teamB: "MEXICO",
  scoreA: 2,
  scoreB: 1,
  time: "78'",
  status: "live",
  stadiumName: "MetLife Stadium",
  attendance: 78520
};

const mockTransitMetrics = {
  metroStatus: "delayed",
  metroDelayMinutes: 8,
  rideshareWaitTimeMinutes: 22,
  parkingLotOccupancy: {
    lotA: 96,
    lotB: 68,
    lotC: 45
  },
  shuttleFrequencyMinutes: 5
};

const mockSustainabilityMetrics = {
  estimatedCarbonKg: 12450,
  waterFlowLitersPerMin: 1420,
  powerGridLoadKw: 2450,
  wasteBinAvgFullness: 68,
  surplusConcessionUnits: 450
};

// Export datasets to make them accessible by app.js
if (typeof module !== "undefined") {
  module.exports = {
    mockStadiumZones,
    mockVolunteers,
    mockIncidents,
    mockMatchInfo,
    mockTransitMetrics,
    mockSustainabilityMetrics
  };
}
