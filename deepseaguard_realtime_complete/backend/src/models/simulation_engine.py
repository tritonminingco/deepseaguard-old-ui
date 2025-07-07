# Real-time AUV Data Simulation Engine
# Generates realistic telemetry data with scenarios and violations

import random
import time
import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from src.models.data_schema import (
    AUVTelemetry, Position, EnvironmentalData, OperationalData, 
    ComplianceMetrics, SpeciesDetection, Alert, Mission,
    ISAComplianceChecker
)

class AUVSimulator:
    """Simulates realistic AUV operations with scenarios"""
    
    def __init__(self, auv_id: str, auv_name: str, manufacturer: str, model: str):
        self.auv_id = auv_id
        self.auv_name = auv_name
        self.manufacturer = manufacturer
        self.model = model
        
        # Base position (Clarion-Clipperton Zone)
        self.base_lat = -12.5678 + random.uniform(-0.1, 0.1)
        self.base_lon = -78.9012 + random.uniform(-0.1, 0.1)
        self.base_depth = 2450.0 + random.uniform(-200, 200)
        
        # Movement parameters
        self.current_lat = self.base_lat
        self.current_lon = self.base_lon
        self.current_depth = self.base_depth
        self.heading = random.uniform(0, 360)
        self.speed = 1.2
        
        # Mission state
        self.mission_start_time = datetime.now()
        self.mission_progress = 0.0
        self.battery_level = 100.0
        self.collection_rate = 0.0
        self.sensitive_zone_time = 0.0
        
        # Scenario state
        self.current_scenario = None
        self.scenario_start_time = None
        self.violation_triggered = False
        
        # Environmental baselines
        self.base_temperature = 4.0 + random.uniform(-0.5, 0.5)
        self.base_salinity = 34.5 + random.uniform(-0.3, 0.3)
        self.base_sediment = 15.0 + random.uniform(-5, 5)
        
    def update_position(self, delta_time: float):
        """Update AUV position based on movement"""
        # Convert speed to lat/lon change (approximate)
        distance_km = self.speed * delta_time / 1000  # km
        lat_change = distance_km * math.cos(math.radians(self.heading)) / 111.0
        lon_change = distance_km * math.sin(math.radians(self.heading)) / (111.0 * math.cos(math.radians(self.current_lat)))
        
        self.current_lat += lat_change
        self.current_lon += lon_change
        
        # Add some random drift
        self.current_lat += random.uniform(-0.0001, 0.0001)
        self.current_lon += random.uniform(-0.0001, 0.0001)
        
        # Slight heading changes
        self.heading += random.uniform(-5, 5)
        self.heading = self.heading % 360
        
        # Depth variations
        self.current_depth += random.uniform(-2, 2)
        self.current_depth = max(2000, min(3000, self.current_depth))
    
    def simulate_environmental_data(self) -> EnvironmentalData:
        """Generate realistic environmental sensor data"""
        # Base values with natural variation
        temperature = self.base_temperature + random.uniform(-0.2, 0.2)
        salinity = self.base_salinity + random.uniform(-0.1, 0.1)
        dissolved_oxygen = 6.5 + random.uniform(-0.5, 0.5)
        ph = 8.1 + random.uniform(-0.1, 0.1)
        turbidity = 2.0 + random.uniform(-0.5, 0.5)
        pressure = self.current_depth / 10.0 + random.uniform(-1, 1)
        
        # Sediment concentration (key compliance metric)
        sediment = self.base_sediment + random.uniform(-2, 2)
        
        # Apply scenario effects
        if self.current_scenario == "sediment_violation":
            sediment += 15.0  # Push over ISA threshold
        elif self.current_scenario == "equipment_malfunction":
            turbidity += 5.0
            sediment += 8.0
        
        return EnvironmentalData(
            temperature=round(temperature, 1),
            salinity=round(salinity, 1),
            dissolved_oxygen=round(dissolved_oxygen, 1),
            ph=round(ph, 1),
            turbidity=round(turbidity, 1),
            pressure=round(pressure, 1),
            sediment_concentration=round(max(0, sediment), 1),
            current_speed=round(random.uniform(0.1, 0.5), 1),
            current_direction=round(random.uniform(0, 360), 0),
            timestamp=datetime.now().isoformat()
        )
    
    def simulate_operational_data(self) -> OperationalData:
        """Generate realistic operational metrics"""
        # Battery drain over time
        mission_hours = (datetime.now() - self.mission_start_time).total_seconds() / 3600
        self.battery_level = max(0, 100 - (mission_hours * 2.5))  # 2.5% per hour
        
        # Mission progress
        self.mission_progress = min(100, mission_hours * 8.5)  # ~12 hour mission
        
        # Collection rate varies with mission progress
        if self.mission_progress > 20:
            self.collection_rate = 4.0 + random.uniform(-1, 1)
        else:
            self.collection_rate = 0.0
        
        # Efficiency based on conditions
        efficiency = 85 + random.uniform(-5, 5)
        if self.current_scenario == "equipment_malfunction":
            efficiency -= 20
        
        # Speed variations
        current_speed = self.speed + random.uniform(-0.2, 0.2)
        
        return OperationalData(
            battery_level=round(self.battery_level, 1),
            speed=round(current_speed, 1),
            heading=round(self.heading, 1),
            mission_progress=round(self.mission_progress, 1),
            collection_rate=round(self.collection_rate, 1),
            efficiency=round(max(0, efficiency), 1),
            power_consumption=round(400 + random.uniform(-50, 50), 0),
            thruster_status={
                "main": True,
                "bow": self.current_scenario != "equipment_malfunction",
                "stern": True
            },
            sensor_status={
                "camera": True,
                "sonar": True,
                "ctd": self.current_scenario != "equipment_malfunction"
            },
            timestamp=datetime.now().isoformat()
        )
    
    def simulate_compliance_metrics(self, environmental: EnvironmentalData) -> ComplianceMetrics:
        """Generate compliance tracking data"""
        # Check sediment compliance
        sediment_status = ISAComplianceChecker.check_sediment_compliance(
            environmental.sediment_concentration
        )
        
        # Sensitive zone time tracking
        if self.current_scenario == "sensitive_zone_entry":
            self.sensitive_zone_time += 2.0  # 2 minutes per update
        
        zone_status = ISAComplianceChecker.check_sensitive_zone_compliance(
            self.sensitive_zone_time
        )
        
        # Environmental impact score
        impact_score = 95.0
        if sediment_status == "warning":
            impact_score -= 10
        elif sediment_status == "violation":
            impact_score -= 30
        
        if zone_status == "warning":
            impact_score -= 15
        elif zone_status == "violation":
            impact_score -= 40
        
        return ComplianceMetrics(
            sediment_threshold_status=sediment_status,
            sensitive_zone_time=round(self.sensitive_zone_time, 1),
            noise_level=round(95 + random.uniform(-10, 10), 1),
            light_pollution=round(0.1 + random.uniform(-0.05, 0.05), 2),
            collection_quota_used=round(self.mission_progress * 0.4, 1),
            environmental_impact_score=round(max(0, impact_score), 1),
            timestamp=datetime.now().isoformat()
        )
    
    def simulate_species_detections(self) -> List[SpeciesDetection]:
        """Generate species detection events"""
        detections = []
        
        # Random species encounters
        if random.random() < 0.1:  # 10% chance per update
            species_list = [
                ("Benthic Octopod", "protected"),
                ("Deep-sea Skate", "normal"),
                ("Xenophyophore", "protected"),
                ("Sea Cucumber", "normal"),
                ("Deep-sea Fish", "normal")
            ]
            
            species_name, status = random.choice(species_list)
            distance = random.uniform(50, 200)
            
            # Closer encounters in sensitive zones
            if self.current_scenario == "sensitive_zone_entry":
                distance = random.uniform(20, 80)
                status = "endangered"
            
            detection = SpeciesDetection(
                species_id=f"SPECIES-{random.randint(1000, 9999)}",
                species_name=species_name,
                confidence=round(random.uniform(0.7, 0.95), 2),
                distance=round(distance, 1),
                behavior="normal" if distance > 100 else "disturbed",
                protection_status=status,
                timestamp=datetime.now().isoformat()
            )
            detections.append(detection)
        
        return detections
    
    def generate_alerts(self, environmental: EnvironmentalData, 
                       compliance: ComplianceMetrics, 
                       species: List[SpeciesDetection]) -> List[Alert]:
        """Generate real-time alerts based on conditions"""
        alerts = []
        
        # Sediment violation alert
        if compliance.sediment_threshold_status == "violation":
            alert = Alert(
                alert_id=f"ALERT-{random.randint(10000, 99999)}",
                severity="critical",
                category="compliance",
                title="ISA Sediment Threshold Violation",
                description=f"Sediment concentration {environmental.sediment_concentration} mg/L exceeds ISA limit of 25 mg/L",
                auv_id=self.auv_id,
                position=Position(
                    latitude=self.current_lat,
                    longitude=self.current_lon,
                    depth=self.current_depth,
                    altitude=15.0,
                    timestamp=datetime.now().isoformat()
                ),
                auto_resolved=False,
                acknowledged=False,
                timestamp=datetime.now().isoformat(),
                expires_at=None
            )
            alerts.append(alert)
        
        # Species proximity alert
        for detection in species:
            if detection.distance < 100 and detection.protection_status in ["protected", "endangered"]:
                alert = Alert(
                    alert_id=f"ALERT-{random.randint(10000, 99999)}",
                    severity="warning" if detection.distance > 50 else "critical",
                    category="species",
                    title=f"Protected Species Proximity Alert",
                    description=f"{detection.species_name} detected at {detection.distance}m distance",
                    auv_id=self.auv_id,
                    position=Position(
                        latitude=self.current_lat,
                        longitude=self.current_lon,
                        depth=self.current_depth,
                        altitude=15.0,
                        timestamp=datetime.now().isoformat()
                    ),
                    auto_resolved=True,
                    acknowledged=False,
                    timestamp=datetime.now().isoformat(),
                    expires_at=(datetime.now() + timedelta(minutes=30)).isoformat()
                )
                alerts.append(alert)
        
        # Low battery alert
        if self.battery_level < 30:
            alert = Alert(
                alert_id=f"ALERT-{random.randint(10000, 99999)}",
                severity="warning" if self.battery_level > 20 else "critical",
                category="operational",
                title="Low Battery Warning",
                description=f"Battery level at {self.battery_level}% - consider return to surface",
                auv_id=self.auv_id,
                position=Position(
                    latitude=self.current_lat,
                    longitude=self.current_lon,
                    depth=self.current_depth,
                    altitude=15.0,
                    timestamp=datetime.now().isoformat()
                ),
                auto_resolved=False,
                acknowledged=False,
                timestamp=datetime.now().isoformat(),
                expires_at=None
            )
            alerts.append(alert)
        
        return alerts
    
    def trigger_scenario(self, scenario: str):
        """Trigger a specific scenario for demo purposes"""
        self.current_scenario = scenario
        self.scenario_start_time = datetime.now()
        self.violation_triggered = False
        
        print(f"[{self.auv_id}] Triggered scenario: {scenario}")
    
    def generate_telemetry(self) -> AUVTelemetry:
        """Generate complete telemetry package"""
        # Update position
        self.update_position(5.0)  # 5 second update interval
        
        # Generate all data components
        environmental = self.simulate_environmental_data()
        operational = self.simulate_operational_data()
        compliance = self.simulate_compliance_metrics(environmental)
        species = self.simulate_species_detections()
        alerts = self.generate_alerts(environmental, compliance, species)
        
        # Mission data
        mission = Mission(
            mission_id=f"MISSION-{self.auv_id}-2024-001",
            mission_type="collection",
            start_time=self.mission_start_time.isoformat(),
            planned_end_time=(self.mission_start_time + timedelta(hours=12)).isoformat(),
            actual_end_time=None,
            status="active",
            priority="high",
            area_bounds=[],
            objectives=["Collect polymetallic nodules", "Monitor environmental impact"],
            constraints={"max_depth": 3000, "max_sediment": 25}
        )
        
        # Complete telemetry package
        telemetry = AUVTelemetry(
            auv_id=self.auv_id,
            auv_name=self.auv_name,
            manufacturer=self.manufacturer,
            model=self.model,
            position=Position(
                latitude=self.current_lat,
                longitude=self.current_lon,
                depth=self.current_depth,
                altitude=15.0 + random.uniform(-2, 2),
                timestamp=datetime.now().isoformat()
            ),
            environmental=environmental,
            operational=operational,
            compliance=compliance,
            species_detections=species,
            active_alerts=alerts,
            mission=mission,
            last_communication=datetime.now().isoformat(),
            communication_quality=round(0.9 + random.uniform(-0.1, 0.05), 2),
            timestamp=datetime.now().isoformat()
        )
        
        return telemetry

class ScenarioManager:
    """Manages demo scenarios for investor presentations"""
    
    def __init__(self, simulators: List[AUVSimulator]):
        self.simulators = simulators
        self.scenario_queue = []
        self.current_scenario_index = 0
        
    def add_scenario(self, auv_id: str, scenario: str, delay_seconds: int):
        """Add a scenario to the queue"""
        self.scenario_queue.append({
            'auv_id': auv_id,
            'scenario': scenario,
            'trigger_time': datetime.now() + timedelta(seconds=delay_seconds)
        })
    
    def setup_investor_demo(self):
        """Setup scenarios for investor demo"""
        # Clear existing scenarios
        self.scenario_queue = []
        
        # Demo timeline (5-minute presentation)
        self.add_scenario("AUV-001", "normal_operation", 0)
        self.add_scenario("AUV-002", "normal_operation", 0)
        self.add_scenario("AUV-003", "normal_operation", 0)
        
        # Minute 1: Show normal operations
        self.add_scenario("AUV-002", "sediment_violation", 60)
        
        # Minute 2: Trigger compliance violation
        self.add_scenario("AUV-003", "sensitive_zone_entry", 120)
        
        # Minute 3: Species detection
        self.add_scenario("AUV-001", "equipment_malfunction", 180)
        
        # Minute 4: Equipment issue
        # Minute 5: Recovery and reporting
        
        print("Investor demo scenarios loaded:")
        for scenario in self.scenario_queue:
            print(f"  {scenario['auv_id']}: {scenario['scenario']} at {scenario['trigger_time']}")
    
    def update_scenarios(self):
        """Check and trigger queued scenarios"""
        current_time = datetime.now()
        
        for scenario in self.scenario_queue[:]:
            if current_time >= scenario['trigger_time']:
                # Find the simulator and trigger scenario
                for sim in self.simulators:
                    if sim.auv_id == scenario['auv_id']:
                        sim.trigger_scenario(scenario['scenario'])
                        break
                
                # Remove triggered scenario
                self.scenario_queue.remove(scenario)

# Example usage
if __name__ == "__main__":
    # Create AUV simulators
    simulators = [
        AUVSimulator("AUV-001", "Deep Explorer", "Kongsberg", "HUGIN Superior"),
        AUVSimulator("AUV-002", "Ocean Surveyor", "Saab", "Sabertooth"),
        AUVSimulator("AUV-003", "Abyss Collector", "Bluefin", "Sandshark")
    ]
    
    # Setup scenario manager
    scenario_manager = ScenarioManager(simulators)
    scenario_manager.setup_investor_demo()
    
    # Simulate for 30 seconds
    for i in range(6):  # 6 updates, 5 seconds apart
        print(f"\n=== Update {i+1} ===")
        scenario_manager.update_scenarios()
        
        for sim in simulators:
            telemetry = sim.generate_telemetry()
            print(f"{sim.auv_id}: Pos({telemetry.position.latitude:.4f}, {telemetry.position.longitude:.4f}) "
                  f"Sediment: {telemetry.environmental.sediment_concentration} mg/L "
                  f"Alerts: {len(telemetry.active_alerts)}")
        
        time.sleep(5)

