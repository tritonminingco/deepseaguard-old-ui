from typing import Dict

ENVIRONMENTAL_THRESHOLDS = {
    "temperature_c": {
        "warning": {"min": 1.5, "max": 2.5},
        "critical": {"min": 1.0, "max": 3.0}
    },
    "turbidity": {
        "warning": {"min": 0.05, "max": 0.25},
        "critical": {"min": 0.0, "max": 0.3}
    }
}
