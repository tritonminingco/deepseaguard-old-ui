import random
import asyncio
from fastapi import FastAPI, WebSocket
from datetime import datetime, timezone

app = FastAPI(
    title="Mock Telemetry Service",
    description="Mock AUV telemetry data broadcaster",
    version="0.1.0",
)
 
def generate_mock_telemetry():
    """
    Generate mock AUV telemetry data with occasional threshold violations:
    - Temperature warning: outside 1.5°C to 2.5°C
    - Temperature critical: outside 1.0°C to 3.0°C
    - Turbidity warning: outside 0.05 to 0.25
    - Turbidity critical: outside 0.0 to 0.3
    """
    # Simulate different scenarios with weighted probabilities
    scenario = random.choices(
        ['normal', 'temp_warning', 'temp_critical', 'turbidity_warning', 'turbidity_critical'],
        weights=[0.3, 0.2, 0.1, 0.3, 0.1]  # 30% normal, 70% various alerts
    )[0]
    
    # Generate temperature based on scenario
    if scenario == 'temp_warning':
        # Generate temperature just outside warning range
        temperature_c = random.choice([
            random.uniform(1.0, 1.4),  # Below warning min
            random.uniform(2.6, 3.0)   # Above warning max
        ])
    elif scenario == 'temp_critical':
        # Generate temperature outside critical range
        temperature_c = random.choice([
            random.uniform(0.5, 0.9),  # Below critical min
            random.uniform(3.1, 3.5)   # Above critical max
        ])
    else:
        # Normal temperature range
        temperature_c = random.uniform(1.8, 2.4)

    # Generate turbidity based on scenario
    if scenario == 'turbidity_warning':
        # Generate turbidity just outside warning range
        turbidity = random.choice([
            random.uniform(0.01, 0.04),  # Below warning min
            random.uniform(0.26, 0.29)   # Above warning max
        ])
    elif scenario == 'turbidity_critical':
        # Generate turbidity outside critical range
        turbidity = random.choice([
            random.uniform(-0.1, -0.01),  # Below critical min
            random.uniform(0.31, 0.4)     # Above critical max
        ])
    else:
        # Normal turbidity range
        turbidity = random.uniform(0.1, 0.2)

    return {
        "auv_id": f"AUV-{random.randint(1,9)}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "location": {
            "lat": random.uniform(-9.0, -8.0),
            "lon": random.uniform(-147.0, -146.0)
        },
        "depth_m": random.uniform(4000, 4500),
        "zone_id": f"ISA-ZONE-{random.randint(1,10)}", # It is a zone in which AUV should be
        "velocity_knots": random.uniform(1.5, 3.5),
        "temperature_c": temperature_c,
        "turbidity": turbidity
    }


@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    """
    Mock WebSocket endpoint to simulate telemetry data stream.
    """
    await websocket.accept()
    try:
        while True:
            telemetry = generate_mock_telemetry()
            await websocket.send_json(telemetry)
            await asyncio.sleep(random.uniform(8, 13))  # Random delay between 8 to 13 seconds
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)  # Using port 8001 to avoid conflict
