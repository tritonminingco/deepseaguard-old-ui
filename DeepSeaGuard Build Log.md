# DeepSeaGuard Build Log  
_Real-time monitoring and compliance system for deep-sea operations_  
Maintained by Triton Mining Co.  
Last updated: [2025-07-29]

---

## Why this log exists

Most of the ocean floor is still unmapped, unregulated, and unmonitored.  
DeepSeaGuard is our attempt to bring transparency, oversight, and accountability to deep-sea mining operations using open-source software. This log captures our build journey without filters—code wins, failures, late-night patches, wrong turns, and breakthroughs.

We’re not looking for hype. We’re looking for contributors who care and give a shit. 
---

##  Week 1: Foundational Work  
**[2025-02-03]**

- Initialized repo with basic file structure (React + Vite + Leaflet)
- Created mock AUV telemetry system with static positions
- Built alert system with mocked severity logic
- Setup dark mode toggle + root theming with CSS variables
- Faked sediment plume logic with CircleMarkers
- Added ISA compliance data mockup (sediment thresholds, protected zones)

**Bugs Encountered**  
- Leaflet icons didn’t load (missing import from unpkg)  
- Battery warning UI not syncing with mock data  
- Environmental chart loads before data state is ready (fixed with delay fallback)

---

## 🔧 Week 2: Starting Real Functionality  
**[2025-02-12]**

- Integrated historical playback system and time zone selector
- Added dropdown for AUV selection and Overview Mode
- Created mock ISA shapefile parser (next: real shapefile ingestion)
- Hooked up dummy telemetry API for future real-data swap
- Created build hooks for dark/light mode toggle memory

**Current Blockers**  
- Struggling with live shapefile integration into Leaflet  
- Need to simulate real GPS drift for AUVs  
- Alert panel doesn't persist open/close state

---

##  Contributor Tasks Open  
- [ ] Add Leaflet support for ISA shapefiles  
- [ ] Mock real-time AUV drift  
- [ ] Store alert panel open/close state in localStorage  
- [ ] Replace alert mock data with JSON feed from backend  
- [ ] ISA compliance report auto-generation stub (Markdown/PDF)

---

## 🛠 Next Week  
- Start pushing real shapefile parsing (ISA CCZ map)  
- Begin implementing species proximity buffer zone alerts  
- Push devlog video walkthrough of dashboard

---

Contributors welcome. If you're reading this and see something you can improve, fork and PR.

