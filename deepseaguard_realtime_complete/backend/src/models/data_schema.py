# DeepSeaGuard Universal Data Schema
# ISA-compliant data format for multi-manufacturer AUV integration

from datetime import datetime
from typing import Dict, List, Optional, Union
from dataclasses import dataclass, asdict
import json

@dataclass
class Position:
    """Geographic position with depth"""
    latitude: float  # Decimal degrees
    longitude: float  # Decimal degrees
    depth: float  # Meters below sea level
    altitude: float  # Meters above seafloor
    timestamp: str  # ISO 8601 format

@dataclass
class EnvironmentalData:
    """Environmental sensor readings"""
    temperature: float  # Celsius
    salinity: float  # PSU (Practical Salinity Units)
    dissolved_oxygen: float  # mg/L
    ph: float  # pH scale
    turbidity: float  # NTU (Nephelometric Turbidity Units)
    pressure: float  # bar
    sediment_concentration: float  # mg/L
    current_speed: float  # m/s
    current_direction: float  # degrees
    timestamp: str

@dataclass
class OperationalData:
    """AUV operational metrics"""
    battery_level: float  # Percentage (0-100)
    speed: float  # m/s
    heading: float  # degrees (0-360)
    mission_progress: float  # Percentage (0-100)
    collection_rate: float  # kg/hour
    efficiency: float  # Percentage (0-100)
    power_consumption: float  # Watts
    thruster_status: Dict[str, bool]  # Thruster health
    sensor_status: Dict[str, bool]  # Sensor health
    timestamp: str

@dataclass
class ComplianceMetrics:
    """ISA compliance tracking"""
    sediment_threshold_status: str  # "compliant" | "warning" | "violation"
    sensitive_zone_time: float  # Minutes in sensitive zones
    noise_level: float  # dB
    light_pollution: float  # Lux
    collection_quota_used: float  # Percentage of allowed collection
    environmental_impact_score: float  # 0-100 scale
    timestamp: str

@dataclass
class SpeciesDetection:
    """Protected species monitoring"""
    species_id: str  # Species identifier
    species_name: str  # Common name
    confidence: float  # Detection confidence (0-1)
    distance: float  # Meters from AUV
    behavior: str  # "normal" | "disturbed" | "fleeing"
    protection_status: str  # "protected" | "endangered" | "critical"
    timestamp: str

@dataclass
class Alert:
    """Real-time alert system"""
    alert_id: str  # Unique identifier
    severity: str  # "info" | "warning" | "critical" | "emergency"
    category: str  # "environmental" | "operational" | "compliance" | "species"
    title: str  # Alert title
    description: str  # Detailed description
    auv_id: str  # Associated AUV
    position: Position  # Location of alert
    auto_resolved: bool  # Whether alert can auto-resolve
    acknowledged: bool  # Whether alert has been acknowledged
    timestamp: str
    expires_at: Optional[str]  # When alert expires (if applicable)

@dataclass
class Mission:
    """Mission metadata"""
    mission_id: str  # Unique mission identifier
    mission_type: str  # "survey" | "collection" | "monitoring" | "maintenance"
    start_time: str  # ISO 8601 format
    planned_end_time: str  # ISO 8601 format
    actual_end_time: Optional[str]  # ISO 8601 format
    status: str  # "planned" | "active" | "paused" | "completed" | "aborted"
    priority: str  # "low" | "medium" | "high" | "critical"
    area_bounds: List[Position]  # Mission area polygon
    objectives: List[str]  # Mission objectives
    constraints: Dict[str, Union[str, float]]  # Operational constraints

@dataclass
class AUVTelemetry:
    """Complete AUV telemetry package"""
    auv_id: str  # Unique AUV identifier
    auv_name: str  # Human-readable name
    manufacturer: str  # "Kongsberg" | "Saab" | "Bluefin" | "Custom"
    model: str  # AUV model
    position: Position  # Current position
    environmental: EnvironmentalData  # Environmental readings
    operational: OperationalData  # Operational metrics
    compliance: ComplianceMetrics  # Compliance status
    species_detections: List[SpeciesDetection]  # Species nearby
    active_alerts: List[Alert]  # Current alerts
    mission: Mission  # Current mission
    last_communication: str  # Last successful communication
    communication_quality: float  # Signal strength (0-1)
    timestamp: str  # Telemetry timestamp

class DataSchemaValidator:
    """Validates incoming data against schema"""
    
    @staticmethod
    def validate_position(data: Dict) -> bool:
        """Validate position data"""
        required_fields = ['latitude', 'longitude', 'depth', 'altitude', 'timestamp']
        return all(field in data for field in required_fields)
    
    @staticmethod
    def validate_environmental(data: Dict) -> bool:
        """Validate environmental data"""
        required_fields = ['temperature', 'salinity', 'dissolved_oxygen', 'ph', 
                          'turbidity', 'pressure', 'sediment_concentration', 'timestamp']
        return all(field in data for field in required_fields)
    
    @staticmethod
    def validate_telemetry(data: Dict) -> bool:
        """Validate complete telemetry package"""
        required_fields = ['auv_id', 'auv_name', 'position', 'environmental', 
                          'operational', 'compliance', 'timestamp']
        return all(field in data for field in required_fields)

class ISAComplianceChecker:
    """ISA compliance rule engine"""
    
    # ISA Compliance Thresholds
    SEDIMENT_THRESHOLD = 25.0  # mg/L
    SENSITIVE_ZONE_TIME_LIMIT = 120  # minutes
    NOISE_LIMIT = 120  # dB
    MAX_COLLECTION_RATE = 5.0  # kg/hour
    
    @staticmethod
    def check_sediment_compliance(sediment_level: float) -> str:
        """Check sediment discharge compliance"""
        if sediment_level <= ISAComplianceChecker.SEDIMENT_THRESHOLD * 0.8:
            return "compliant"
        elif sediment_level <= ISAComplianceChecker.SEDIMENT_THRESHOLD:
            return "warning"
        else:
            return "violation"
    
    @staticmethod
    def check_sensitive_zone_compliance(time_in_zone: float) -> str:
        """Check sensitive zone time compliance"""
        if time_in_zone <= ISAComplianceChecker.SENSITIVE_ZONE_TIME_LIMIT * 0.8:
            return "compliant"
        elif time_in_zone <= ISAComplianceChecker.SENSITIVE_ZONE_TIME_LIMIT:
            return "warning"
        else:
            return "violation"
    
    @staticmethod
    def generate_compliance_score(telemetry: AUVTelemetry) -> float:
        """Generate overall compliance score (0-100)"""
        score = 100.0
        
        # Sediment compliance
        sediment_status = ISAComplianceChecker.check_sediment_compliance(
            telemetry.environmental.sediment_concentration
        )
        if sediment_status == "warning":
            score -= 10
        elif sediment_status == "violation":
            score -= 30
        
        # Sensitive zone compliance
        zone_status = ISAComplianceChecker.check_sensitive_zone_compliance(
            telemetry.compliance.sensitive_zone_time
        )
        if zone_status == "warning":
            score -= 15
        elif zone_status == "violation":
            score -= 40
        
        # Species proximity penalty
        for detection in telemetry.species_detections:
            if detection.protection_status in ["endangered", "critical"]:
                if detection.distance < 50:  # Within 50m
                    score -= 20
                elif detection.distance < 100:  # Within 100m
                    score -= 10
        
        return max(0.0, score)

def serialize_telemetry(telemetry: AUVTelemetry) -> str:
    """Serialize telemetry to JSON string"""
    return json.dumps(asdict(telemetry), indent=2)

def deserialize_telemetry(json_str: str) -> AUVTelemetry:
    """Deserialize JSON string to telemetry object"""
    data = json.loads(json_str)
    # Note: This would need proper object reconstruction in production
    return data

# Example usage and test data
if __name__ == "__main__":
    # Create sample telemetry data
    sample_position = Position(
        latitude=-12.5678,
        longitude=-78.9012,
        depth=2450.0,
        altitude=15.0,
        timestamp=datetime.now().isoformat()
    )
    
    sample_environmental = EnvironmentalData(
        temperature=4.2,
        salinity=34.8,
        dissolved_oxygen=6.5,
        ph=8.1,
        turbidity=2.3,
        pressure=250.7,
        sediment_concentration=18.5,
        current_speed=0.3,
        current_direction=45.0,
        timestamp=datetime.now().isoformat()
    )
    
    sample_operational = OperationalData(
        battery_level=85.0,
        speed=1.2,
        heading=270.0,
        mission_progress=68.0,
        collection_rate=4.2,
        efficiency=87.0,
        power_consumption=450.0,
        thruster_status={"main": True, "bow": True, "stern": True},
        sensor_status={"camera": True, "sonar": True, "ctd": True},
        timestamp=datetime.now().isoformat()
    )
    
    sample_compliance = ComplianceMetrics(
        sediment_threshold_status="compliant",
        sensitive_zone_time=0.0,
        noise_level=95.0,
        light_pollution=0.1,
        collection_quota_used=34.5,
        environmental_impact_score=92.0,
        timestamp=datetime.now().isoformat()
    )
    
    sample_mission = Mission(
        mission_id="MISSION-2024-001",
        mission_type="collection",
        start_time=datetime.now().isoformat(),
        planned_end_time=datetime.now().isoformat(),
        actual_end_time=None,
        status="active",
        priority="high",
        area_bounds=[sample_position],
        objectives=["Collect polymetallic nodules", "Monitor environmental impact"],
        constraints={"max_depth": 3000, "max_sediment": 25}
    )
    
    sample_telemetry = AUVTelemetry(
        auv_id="AUV-001",
        auv_name="Deep Explorer",
        manufacturer="Kongsberg",
        model="HUGIN Superior",
        position=sample_position,
        environmental=sample_environmental,
        operational=sample_operational,
        compliance=sample_compliance,
        species_detections=[],
        active_alerts=[],
        mission=sample_mission,
        last_communication=datetime.now().isoformat(),
        communication_quality=0.95,
        timestamp=datetime.now().isoformat()
    )
    
    # Test serialization
    json_output = serialize_telemetry(sample_telemetry)
    print("Sample telemetry JSON:")
    print(json_output[:500] + "..." if len(json_output) > 500 else json_output)
    
    # Test compliance checking
    compliance_score = ISAComplianceChecker.generate_compliance_score(sample_telemetry)
    print(f"\nCompliance Score: {compliance_score}/100")

