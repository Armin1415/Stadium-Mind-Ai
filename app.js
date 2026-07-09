// StadiumMind AI - Core Front-end Application Controller

// State Management
let currentView = 'command_center';
let selectedSector = null;
let navigationRouteActive = false;
let emergencyActive = false;

// Local Simulation Database (from mock_data.js context)
// Since we run in plain client-side browser, we reference the global mock objects.
const state = {
  zones: [...mockStadiumZones],
  volunteers: [...mockVolunteers],
  incidents: [...mockIncidents],
  match: { ...mockMatchInfo },
  transit: { ...mockTransitMetrics },
  sustainability: { ...mockSustainabilityMetrics }
};

// SVG coordinates mapping for routing simulation on stadium diagram
const sectorCoordinates = {
  gate_a_ingress: { x: 150, y: 350 },
  gate_b_ingress: { x: 450, y: 200 },
  gate_c_vip: { x: 300, y: 80 },
  concourse_west: { x: 100, y: 200 },
  sector_b_stands: { x: 300, y: 240 }
};

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  setupEventListeners();
  startSimulationTick();
});

// Initialize UI
function initDashboard() {
  renderStadiumMap();
  renderIncidentsList();
  renderVolunteerStatusList();
  renderSustainabilityPanel();
  renderTransitPanel();
  updateHeaderTicker();
}

function setupEventListeners() {
  // Navigation Sidebar clicks
  document.querySelectorAll('nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('nav .nav-item').forEach(i => i.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      switchView(target.dataset.view);
    });
  });

  // Chat Input
  const fanChatInput = document.getElementById('fan-chat-input');
  if (fanChatInput) {
    fanChatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendFanChatMessage();
    });
  }
}

// Switch between dashboard workspaces
function switchView(viewName) {
  currentView = viewName;
  
  // Show / Hide containers
  document.getElementById('view-command-center').style.display = viewName === 'command_center' ? 'block' : 'none';
  document.getElementById('view-fan-simulator').style.display = viewName === 'fan_sim' ? 'grid' : 'none';
  document.getElementById('view-volunteer').style.display = viewName === 'volunteer_sim' ? 'grid' : 'none';
  document.getElementById('view-sustainability').style.display = viewName === 'sustainability' ? 'grid' : 'none';
}

// Draw the Stadium Schematic (Interactive SVG Digital Twin)
function renderStadiumMap() {
  const mapContainer = document.getElementById('stadium-map-container');
  if (!mapContainer) return;

  // Simple SVG mockup of MetLife Stadium
  let svgContent = `
    <svg viewBox="0 0 600 400" class="stadium-svg" id="stadium-vector">
      <defs>
        <radialGradient id="fieldGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#006622" />
          <stop offset="100%" stop-color="#003311" />
        </radialGradient>
      </defs>

      <!-- Outer Stadium wall -->
      <ellipse cx="300" cy="200" rx="260" ry="170" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8" />
      <ellipse cx="300" cy="200" rx="250" ry="160" fill="rgba(8,12,32,0.6)" stroke="rgba(255,255,255,0.05)" stroke-width="2" />

      <!-- Sector Segments -->
      <!-- West Concourse Sector -->
      <path d="M 60,200 A 240,150 0 0,1 150,80 L 220,130 A 100,70 0 0,0 160,200 Z" 
            class="stadium-sector ${getSectorClass('concourse_west')}" 
            onclick="selectMapSector('concourse_west')" id="map-concourse_west" />
      
      <!-- Gate C VIP Sector (North) -->
      <path d="M 150,80 A 240,150 0 0,1 450,80 L 380,130 A 100,70 0 0,0 220,130 Z" 
            class="stadium-sector ${getSectorClass('gate_c_vip')}" 
            onclick="selectMapSector('gate_c_vip')" id="map-gate_c_vip" />
      
      <!-- Gate B Sector (East) -->
      <path d="M 450,80 A 240,150 0 0,1 540,200 L 440,200 A 100,70 0 0,0 380,130 Z" 
            class="stadium-sector ${getSectorClass('gate_b_ingress')}" 
            onclick="selectMapSector('gate_b_ingress')" id="map-gate_b_ingress" />
      
      <!-- Sector B Stands / Gate A Ingress (South East / South) -->
      <path d="M 540,200 A 240,150 0 0,1 300,360 L 300,270 A 100,70 0 0,0 440,200 Z" 
            class="stadium-sector ${getSectorClass('sector_b_stands')}" 
            onclick="selectMapSector('sector_b_stands')" id="map-sector_b_stands" />
      
      <path d="M 300,360 A 240,150 0 0,1 60,200 L 160,200 A 100,70 0 0,0 300,270 Z" 
            class="stadium-sector ${getSectorClass('gate_a_ingress')}" 
            onclick="selectMapSector('gate_a_ingress')" id="map-gate_a_ingress" />

      <!-- Field center pitch -->
      <ellipse cx="300" cy="200" rx="100" ry="70" fill="url(#fieldGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="2" />
      <line x1="300" y1="130" x2="300" y2="270" stroke="rgba(255,255,255,0.4)" stroke-width="2" />
      <ellipse cx="300" cy="200" rx="20" ry="14" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" />

      <!-- Routing overlay paths -->
      <g id="svg-routes-group"></g>

      <!-- Labels -->
      <text x="300" y="55" fill="var(--text-secondary)" font-size="12" font-family="Space Grotesk" text-anchor="middle">GATE C (VIP/LOUNGE)</text>
      <text x="500" y="200" fill="var(--text-secondary)" font-size="12" font-family="Space Grotesk" text-anchor="middle">GATE B</text>
      <text x="300" y="380" fill="var(--text-secondary)" font-size="12" font-family="Space Grotesk" text-anchor="middle">GATE A INGRESS</text>
      <text x="80" y="200" fill="var(--text-secondary)" font-size="12" font-family="Space Grotesk" text-anchor="middle">WEST FOOD</text>
    </svg>
  `;
  mapContainer.innerHTML = svgContent;
}

function getSectorClass(zoneId) {
  if (emergencyActive) return 'sector-critical';
  const zone = state.zones.find(z => z.id === zoneId);
  if (!zone) return 'sector-safe';
  if (zone.riskLevel === 'critical') return 'sector-critical';
  if (zone.riskLevel === 'warning') return 'sector-warning';
  return 'sector-safe';
}

function selectMapSector(zoneId) {
  selectedSector = zoneId;
  const zone = state.zones.find(z => z.id === zoneId);
  if (!zone) return;

  // Render detail panel in command center view
  const detailPanel = document.getElementById('sector-details');
  if (detailPanel) {
    detailPanel.innerHTML = `
      <div class="glass-card" style="margin-top: 1rem;">
        <h4 class="card-title">${zone.name}</h4>
        <div style="font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div><strong>Occupancy Volume:</strong> ${zone.currentCount} / ${zone.maxCapacity} (${zone.densityPercentage}%)</div>
          <div><strong>Risk Assessment:</strong> <span style="color: ${getRiskColor(zone.riskLevel)}">${zone.riskLevel.toUpperCase()}</span></div>
          <div><strong>Estimated Entrance Delay:</strong> ${Math.round(zone.averageQueueTimeSeconds / 60)} minutes</div>
          <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
            <button class="btn-secondary" onclick="simulateGateReroute('${zone.id}')">Trigger Flow Balance</button>
            <button class="btn-secondary" onclick="calculateRouteSim('${zone.id}')">Simulate Nav Guide</button>
          </div>
        </div>
      </div>
    `;
  }
}

function getRiskColor(level) {
  if (level === 'critical') return 'var(--color-danger)';
  if (level === 'warning') return 'var(--color-warning)';
  return 'var(--color-safe)';
}

// Smart Routing Simulation - draw dynamic route onto GFX map
function calculateRouteSim(destinationZone) {
  const svg = document.getElementById('stadium-vector');
  const routesGroup = document.getElementById('svg-routes-group');
  if (!svg || !routesGroup) return;

  routesGroup.innerHTML = ''; // clear

  const startCoord = sectorCoordinates['gate_a_ingress']; // Fan starts at entry gate A
  const endCoord = sectorCoordinates[destinationZone];

  if (!startCoord || !endCoord) return;

  // Dynamic route avoiding congested middle Sector B Stands if necessary
  const avoidsCongestion = state.zones.find(z => z.id === 'sector_b_stands').riskLevel === 'critical';
  
  let routePoints = [];
  if (avoidsCongestion && destinationZone !== 'sector_b_stands') {
    // Reroute via West Concourse corridor
    const intermediate = sectorCoordinates['concourse_west'];
    routePoints = [startCoord, intermediate, endCoord];
  } else {
    // Direct path
    routePoints = [startCoord, endCoord];
  }

  // Draw SVG Polyline
  let pathD = `M ${routePoints[0].x} ${routePoints[0].y}`;
  for (let i = 1; i < routePoints.length; i++) {
    pathD += ` L ${routePoints[i].x} ${routePoints[i].y}`;
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--accent-cyan)');
  path.setAttribute('stroke-width', '4');
  path.setAttribute('stroke-dasharray', '8, 8');
  path.setAttribute('id', 'routing-trail');
  
  // Glowing animation dot
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('r', '7');
  dot.setAttribute('fill', 'var(--accent-gold)');
  
  const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
  anim.setAttribute('path', pathD);
  anim.setAttribute('dur', '4s');
  anim.setAttribute('repeatCount', 'indefinite');
  dot.appendChild(anim);

  routesGroup.appendChild(path);
  routesGroup.appendChild(dot);
  navigationRouteActive = true;
}

// Trigger Gate Reroute simulation
function simulateGateReroute(zoneId) {
  const zone = state.zones.find(z => z.id === zoneId);
  if (!zone) return;

  // Dispatch AI redirect instructions
  zone.currentCount = Math.round(zone.currentCount * 0.7); // reduce count by redirecting
  zone.densityPercentage = Math.round((zone.currentCount / zone.maxCapacity) * 100);
  zone.riskLevel = zone.densityPercentage > 80 ? 'warning' : 'safe';
  zone.averageQueueTimeSeconds = Math.max(120, zone.averageQueueTimeSeconds - 240);

  // Trigger notification feed
  addIncidentLog(`AI Balance dispatched: Redirecting 30% of traffic from ${zone.name} to Gate B.`, 'low');
  
  // Re-render
  initDashboard();
  selectMapSector(zoneId);
}

// Render incident tables
function renderIncidentsList() {
  const container = document.getElementById('incidents-feed');
  if (!container) return;

  container.innerHTML = state.incidents.map(inc => `
    <div class="feed-item">
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <strong>${inc.title}</strong>
          <span class="severity-pill severity-${inc.severity}">${inc.severity}</span>
        </div>
        <div style="color: var(--text-secondary); margin-bottom: 0.4rem;">Location: ${inc.section} | Status: <span style="font-weight:600;">${inc.status}</span></div>
        <div style="background: rgba(0,242,254,0.03); border-left: 2px solid var(--accent-cyan); padding: 0.4rem; font-size: 0.8rem; color: var(--text-primary);">
          <strong>Gemini Assist SOP:</strong> ${inc.aiActionPlan}
        </div>
      </div>
    </div>
  `).join('');
}

// Render volunteer grids
function renderVolunteerStatusList() {
  const container = document.getElementById('volunteers-grid');
  if (!container) return;

  container.innerHTML = state.volunteers.map(vol => `
    <div class="feed-item">
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
        <div>
          <strong>${vol.name}</strong> <span style="color: var(--text-secondary); font-size: 0.8rem;">(${vol.location})</span>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">Skills: ${vol.skills.join(', ')}</div>
        </div>
        <div style="text-align: right;">
          <span class="severity-pill" style="background: ${vol.status === 'available' ? 'rgba(0,230,115,0.1)' : 'rgba(255,51,51,0.1)'}; color: ${vol.status === 'available' ? 'var(--color-safe)' : 'var(--color-danger)'};">${vol.status}</span>
          <div style="font-size: 0.8rem; margin-top: 0.2rem;">★ ${vol.rating}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// Render Sustainability metrics panel
function renderSustainabilityPanel() {
  const container = document.getElementById('sustainability-details');
  if (!container) return;

  const sustain = state.sustainability;
  container.innerHTML = `
    <div class="metric-row">
      <span>Estimated Match Carbon Footprint:</span>
      <strong>${sustain.estimatedCarbonKg} kg CO₂</strong>
    </div>
    <div class="metric-row">
      <span>Water System Flow Rate:</span>
      <strong>${sustain.waterFlowLitersPerMin} L/min</strong>
    </div>
    <div class="metric-row">
      <span>HVAC/Power Load:</span>
      <strong>${sustain.powerGridLoadKw} kW</strong>
    </div>
    <div class="metric-row">
      <span>Concession Food Surplus Available:</span>
      <strong>${sustain.surplusConcessionUnits} items</strong>
    </div>
    <div style="margin-top: 1rem;">
      <strong>Smart Recycling Sensor Average:</strong>
      <div style="display:flex; align-items:center; gap: 0.5rem; margin-top: 0.25rem;">
        <div class="progress-bar-container" style="flex:1;">
          <div class="progress-bar-fill" style="width: ${sustain.wasteBinAvgFullness}%;"></div>
        </div>
        <span>${sustain.wasteBinAvgFullness}% Full</span>
      </div>
    </div>
  `;
}

// Render transit schedule
function renderTransitPanel() {
  const container = document.getElementById('transit-details');
  if (!container) return;

  const trans = state.transit;
  container.innerHTML = `
    <div class="metric-row">
      <span>Metro Schedule Status:</span>
      <span style="color: var(--color-danger); font-weight:700;">${trans.metroStatus.toUpperCase()} (+${trans.metroDelayMinutes}m)</span>
    </div>
    <div class="metric-row">
      <span>Uber/Lyft Wait times:</span>
      <strong>${trans.rideshareWaitTimeMinutes} mins</strong>
    </div>
    <div class="metric-row">
      <span>Parking Lot Occupancies:</span>
      <div style="font-size: 0.8rem;">
        Lot A: ${trans.parkingLotOccupancy.lotA}% | Lot B: ${trans.parkingLotOccupancy.lotB}%
      </div>
    </div>
    <div style="margin-top: 0.5rem; text-align:right;">
      <button class="btn-secondary" onclick="simulateTransitAdjust()">Trigger Transport Dispatch</button>
    </div>
  `;
}

function simulateTransitAdjust() {
  state.transit.metroDelayMinutes = Math.max(1, state.transit.metroDelayMinutes - 4);
  state.transit.rideshareWaitTimeMinutes = Math.max(10, state.transit.rideshareWaitTimeMinutes - 5);
  addIncidentLog("AI Transit Dispatcher: Scheduled 2 extra trains & assigned secondary rideshare pickup lanes.", "low");
  initDashboard();
}

function updateHeaderTicker() {
  const title = document.getElementById('match-title');
  const score = document.getElementById('match-score');
  if (title) title.innerText = `${state.match.teamA} vs ${state.match.teamB}`;
  if (score) score.innerText = `${state.match.scoreA} - ${state.match.scoreB} (${state.match.time})`;
}

// Insert log reports dynamically
function addIncidentLog(text, severity = 'low') {
  const logItem = {
    id: `inc_gen_${Date.now()}`,
    title: text,
    category: "crowding",
    severity: severity,
    status: "reported",
    section: "Various Sectors",
    time: "Just Now",
    aiActionPlan: "Dynamic redirect alerts broadcasted via app push notifications."
  };
  state.incidents.unshift(logItem);
  renderIncidentsList();
}

// Run basic simulation drifts over time
function startSimulationTick() {
  setInterval(() => {
    // Dynamic gate updates
    state.zones.forEach(z => {
      // Small fluctuation
      const change = Math.round((Math.random() - 0.5) * 60);
      z.currentCount = Math.max(500, Math.min(z.maxCapacity, z.currentCount + change));
      z.densityPercentage = Math.round((z.currentCount / z.maxCapacity) * 100);
      
      if (z.densityPercentage > 90) z.riskLevel = 'critical';
      else if (z.densityPercentage > 75) z.riskLevel = 'warning';
      else z.riskLevel = 'safe';
    });

    // Time ticker
    let matchMin = parseInt(state.match.time);
    if (matchMin < 90) {
      matchMin++;
      state.match.time = matchMin + "'";
    }

    renderStadiumMap();
    updateHeaderTicker();
  }, 10000); // every 10 seconds
}

// ----------------------------------------------------
// Local Gemini Interactive Simulation Engine (AI Sandbox)
// Parses chat prompt variables matching prompts.md instructions
// ----------------------------------------------------
const PRE_CANNED_RESPONSES = {
  seat: {
    text: "According to your ticket barcode scanned at Gate A, you are seated in Block 104, Row K, Seat 12. Proceed straight down the main corridor, take Elevator West 2 to Level 1, and your section is on the right.",
    action: "sector_b_stands"
  },
  restroom: {
    text: "The nearest restroom is located behind Section 106 (West Concourse). Live queues are currently low (under 1 minute wait time). Exit your block and turn left.",
    action: "concourse_west"
  },
  queue: {
    text: "Gate A Ingress queue time is currently 8 minutes. We recommend walking around the stadium perimeter path to Gate B (ingress queue time: 2 minutes), which is 65% less congested.",
    action: "gate_b_ingress"
  },
  food: {
    text: "Vegan and Vegetarian concession options are available at 'GreenPitch Eats' situated in the West Food Court Concourse (behind Section 120). Walk 120 meters West.",
    action: "concourse_west"
  },
  lost: {
    text: "🚨 **LOST CHILD REPORT ASSIST**:<br>1. Stay calm. We have logged an incident in the Command Center.<br>2. Pushed the alert to all volunteers in Block 104 area.<br>3. Steward Carlos Mendez has been dispatched to your location to assist. Please wait at the nearest Info Desk.",
    action: "gate_a_ingress"
  }
};

function sendFanChatMessage() {
  const inputEl = document.getElementById('fan-chat-input');
  const chatMessages = document.getElementById('fan-chat-messages');
  if (!inputEl || !chatMessages || inputEl.value.trim() === '') return;

  const userText = inputEl.value;
  appendMessage(chatMessages, userText, 'user');
  inputEl.value = '';

  // Simulate LLM Processing Delay
  const aiBubbleId = 'ai-bubble-' + Date.now();
  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'chat-bubble ai';
  loadingBubble.id = aiBubbleId;
  loadingBubble.innerText = 'Gemini is thinking...';
  chatMessages.appendChild(loadingBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  setTimeout(() => {
    const aiBubble = document.getElementById(aiBubbleId);
    let matchedResponse = "I am your StadiumMind AI assistant. You can ask me about navigation ('where is my seat?'), queues ('nearest restroom?'), concessions ('vegetarian food?'), or volunteer dispatches.";
    
    // Simple keyword parser matching Gemini prompt roles
    const lowercaseText = userText.toLowerCase();
    for (let key in PRE_CANNED_RESPONSES) {
      if (lowercaseText.includes(key)) {
        matchedResponse = PRE_CANNED_RESPONSES[key].text;
        if (PRE_CANNED_RESPONSES[key].action) {
          calculateRouteSim(PRE_CANNED_RESPONSES[key].action);
        }
        break;
      }
    }
    
    aiBubble.innerHTML = matchedResponse;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 1200);
}

function appendMessage(container, text, sender) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerHTML = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

// ----------------------------------------------------
// Emergency Evacuation / Alarm Triggering Script
// ----------------------------------------------------
function triggerEmergencyState() {
  emergencyActive = !emergencyActive;
  const banner = document.getElementById('emergency-alarm-banner');
  const triggerBtn = document.getElementById('emergency-trigger-btn');
  const emergencyLogs = document.getElementById('emergency-action-plan-log');

  if (emergencyActive) {
    banner.classList.add('active');
    triggerBtn.innerText = 'RESET EMERGENCY STATE';
    triggerBtn.style.background = 'var(--color-safe)';
    
    // Simulate Gemini Emergency Action Plan Generation
    emergencyLogs.innerHTML = `
      <div style="font-family: var(--font-mono); font-size: 0.85rem; display:flex; flex-direction:column; gap: 0.5rem;">
        <div><strong>🚨 EVACUATION ORDER ACTIVATED: SECTOR B STANDS</strong></div>
        <div style="color: var(--color-warning);">* Gemini Evac Path Engine: Bypassing gate corridor 3 due to congestion risks. Redirecting evacuees to Gates A and E.</div>
        <div>* Multilingual Broadcast Queue:</div>
        <blockquote style="border-left: 2px solid var(--accent-gold); padding-left: 0.5rem; font-style: italic;">
          [EN] Attention. Please proceed calmly to exit Gate A. Follow steward instructions.<br>
          [ES] Atención. Por favor, diríjase con calma a la puerta de salida A. Siga las instrucciones.
        </blockquote>
        <div>* Responder Dispatching: Allocated Fire Support Squad 2 and Medical Dispatch Unit A to Sector B access points.</div>
      </div>
    `;
    
    addIncidentLog("CRITICAL ALARM: Structural anomaly reported. Sector B Evacuation triggered.", "critical");
  } else {
    banner.classList.remove('active');
    triggerBtn.innerText = 'TRIGGER CRITICAL EMERGENCY';
    triggerBtn.style.background = 'var(--color-danger)';
    emergencyLogs.innerHTML = `<p style="color: var(--text-muted); font-size:0.9rem;">No active critical emergencies. System running normal.</p>`;
    
    // Reset map
    const routesGroup = document.getElementById('svg-routes-group');
    if (routesGroup) routesGroup.innerHTML = '';
    
    addIncidentLog("Emergency state cleared. Stadium returned to normal operations.", "low");
  }
  
  renderStadiumMap();
}

// ----------------------------------------------------
// Volunteer Simulator helper to dispatch translations
// ----------------------------------------------------
function simulateVolunteerTranslation(phraseKey) {
  const translations = {
    wheelchair: {
      en: "Volunteer Pierre dispatched with spare wheelchair to Elevator West 2.",
      es: "Pierre voluntario despachado con silla de ruedas de repuesto al ascensor oeste 2.",
      ar: "تم إرسال المتطوع بيير بكرسي متحرك احتياطي إلى المصعد الغربي 2."
    },
    medical: {
      en: "First-aid volunteer Amara dispatched to Sector B Stands.",
      es: "Amara voluntaria de primeros auxilios despachada a las gradas del sector B.",
      ar: "تم إرسال متطوعة الإسعافات الأولية أمارا إلى مدرجات القطاع ب."
    }
  };
  
  const transLog = document.getElementById('volunteer-trans-output');
  if (transLog) {
    const data = translations[phraseKey];
    transLog.innerHTML = `
      <div style="font-size:0.85rem; display:flex; flex-direction:column; gap:0.4rem;">
        <div><strong>[EN]</strong> ${data.en}</div>
        <div style="color: var(--accent-gold)"><strong>[ES]</strong> ${data.es}</div>
        <div style="color: var(--accent-cyan)"><strong>[AR]</strong> ${data.ar}</div>
      </div>
    `;
  }
}
