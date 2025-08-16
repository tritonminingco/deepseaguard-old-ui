from datetime import datetime, timezone
from typing import Dict, Optional

class EnvironmentalMonitor:
    def __init__(self, thresholds: Dict):
        self.thresholds = thresholds

    def check_thresholds(self, telemetry: Dict) -> Optional[Dict]:
        """
        Check if telemetry data exceeds environmental thresholds
        Returns an alert if thresholds are exceeded, None otherwise
        """
        alerts = []
        
        # Check temperature
        if "temperature_c" in telemetry:
            temp = telemetry["temperature_c"]
            temp_thresholds = self.thresholds["temperature_c"]
            
            if temp < temp_thresholds["critical"]["min"] or temp > temp_thresholds["critical"]["max"]:
                alerts.append({
                    "parameter": "temperature",
                    "value": temp,
                    "threshold_type": "critical",
                    "limits": temp_thresholds["critical"]
                })
            elif temp < temp_thresholds["warning"]["min"] or temp > temp_thresholds["warning"]["max"]:
                alerts.append({
                    "parameter": "temperature",
                    "value": temp,
                    "threshold_type": "warning",
                    "limits": temp_thresholds["warning"]
                })

        # Check turbidity
        if "turbidity" in telemetry:
            turbidity = telemetry["turbidity"]
            turbidity_thresholds = self.thresholds["turbidity"]
            
            if turbidity < turbidity_thresholds["critical"]["min"] or turbidity > turbidity_thresholds["critical"]["max"]:
                alerts.append({
                    "parameter": "turbidity",
                    "value": turbidity,
                    "threshold_type": "critical",
                    "limits": turbidity_thresholds["critical"]
                })
            elif turbidity < turbidity_thresholds["warning"]["min"] or turbidity > turbidity_thresholds["warning"]["max"]:
                alerts.append({
                    "parameter": "turbidity",
                    "value": turbidity,
                    "threshold_type": "warning",
                    "limits": turbidity_thresholds["warning"]
                })

        if alerts:
            alert_record = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "auv_id": telemetry.get("auv_id"),
                "alerts": alerts
            }
            return alert_record
            
        return None