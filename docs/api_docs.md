# DeepSeaGuard API Documentation

## Authentication

All API requests require authentication using JWT tokens.

**Login**:
```
POST /api/auth/login
Body: { "username": "user", "password": "pass" }
Response: { "token": "jwt_token", "user": {...} }
```

**Validate Token**:
```
GET /api/auth/validate
Headers: { "Authorization": "Bearer jwt_token" }
Response: { "valid": true, "user": {...} }
```

**Logout**:
```
POST /api/auth/logout
Headers: { "Authorization": "Bearer jwt_token" }
```

## AUV Data

**Get All AUVs**:
```
GET /api/auvs
Response: [{ "id": "AUV-001", "name": "Explorer-1", ... }]
```

**Get AUV Details**:
```
GET /api/auvs/{auvId}
Response: { "id": "AUV-001", "name": "Explorer-1", ... }
```

**Get AUV Position History**:
```
GET /api/auvs/{auvId}/positions?start_time=2025-05-01T00:00:00Z&end_time=2025-05-02T00:00:00Z
Response: { "positions": [...] }
```

**Send Command to AUV**:
```
POST /api/auvs/{auvId}/command
Body: { "command": "stop", "parameters": {...} }
Response: { "success": true, "message": "Command sent" }
```

## Environmental Data

**Get Current Environmental Data**:
```
GET /api/environmental
Response: { "sedimentDisturbance": {...}, "waterQuality": {...}, ... }
```

**Get Historical Environmental Data**:
```
GET /api/environmental/{metric}/history?start_time=2025-05-01T00:00:00Z&end_time=2025-05-02T00:00:00Z
Response: { "history": [...] }
```

**Get Species Alerts**:
```
GET /api/environmental/species
Response: { "alerts": [...] }
```

## Operational Data

**Get Current Operational Data**:
```
GET /api/operational/{auvId}
Response: { "position": {...}, "mission": {...}, ... }
```

**Get Mission Details**:
```
GET /api/operational/missions/{missionId}
Response: { "id": "MSN-001", "status": "in-progress", ... }
```

## Compliance Data

**Get Current Compliance Status**:
```
GET /api/compliance
Response: { "isaStandards": [...], "reportingStatus": {...} }
```

**Generate Compliance Report**:
```
POST /api/compliance/reports/generate
Body: { "reportType": "monthly", "format": "pdf", "parameters": {...} }
Response: { "reportId": "ISA-MONTHLY-2025-05", "downloadUrl": "..." }
```

**Get Report List**:
```
GET /api/compliance/reports
Response: { "reports": [...] }
```

## Alert Management

**Get Active Alerts**:
```
GET /api/alerts/active
Response: [{ "id": "ALT-001", "type": "environmental", ... }]
```

**Get Alert History**:
```
GET /api/alerts/history?start_time=2025-05-01T00:00:00Z&end_time=2025-05-02T00:00:00Z
Response: [{ "id": "ALT-001", "type": "environmental", ... }]
```

**Acknowledge Alert**:
```
POST /api/alerts/{alertId}/acknowledge
Response: { "success": true, "alert": {...} }
```

**Resolve Alert**:
```
POST /api/alerts/{alertId}/resolve
Body: { "resolution": "Issue fixed by adjusting parameters" }
Response: { "success": true, "alert": {...} }
```

## WebSocket API

Connect to WebSocket for real-time updates:
```
WebSocket: wss://api.deepseaguard.com/ws/{channel}?token={jwt_token}
Channels: auvs, environmental, operational/{auvId}, compliance, alerts
```
