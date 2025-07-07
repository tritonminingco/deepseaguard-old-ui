#!/bin/bash
# Make the deployment script executable
chmod +x deploy.sh

# Create a package.json file if it doesn't exist
if [ ! -f "package.json" ]; then
  echo "Creating package.json..."
  cat > package.json << EOF
{
  "name": "deepseaguard",
  "version": "1.0.0",
  "description": "DeepSeaGuard Compliance Dashboard",
  "main": "src/main.jsx",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "security": "node src/tests/security.js",
    "deploy": "sudo ./deploy.sh"
  },
  "dependencies": {
    "@influxdata/influxdb-client": "^2.0.0",
    "@react-three/drei": "^9.0.0",
    "@react-three/fiber": "^8.0.0",
    "chart.js": "^4.0.0",
    "leaflet": "^1.9.0",
    "pg": "^8.11.0",
    "react": "^18.2.0",
    "react-chartjs-2": "^5.0.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.0",
    "recharts": "^2.5.0",
    "three": "^0.150.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^14.0.0",
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "@vitejs/plugin-react": "^4.0.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "vite": "^4.3.2"
  }
}
EOF
fi

# Create a jest.config.js file
echo "Creating Jest configuration..."
cat > jest.config.js << EOF
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/tests/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/tests/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
};
EOF

# Create test setup files
mkdir -p src/tests/__mocks__
echo "Creating test setup files..."
cat > src/tests/setup.js << EOF
import '@testing-library/jest-dom';
EOF

cat > src/tests/__mocks__/styleMock.js << EOF
module.exports = {};
EOF

cat > src/tests/__mocks__/fileMock.js << EOF
module.exports = 'test-file-stub';
EOF

# Create a .env file for environment variables
echo "Creating environment configuration..."
cat > .env << EOF
# DeepSeaGuard Environment Configuration

# API Configuration
REACT_APP_API_BASE_URL=https://api.deepseaguard.com/v1
REACT_APP_WS_BASE_URL=wss://api.deepseaguard.com/ws

# Database Configuration
REACT_APP_PG_HOST=localhost
REACT_APP_PG_PORT=5432
REACT_APP_PG_DATABASE=deepseaguard
REACT_APP_PG_USER=postgres
REACT_APP_PG_PASSWORD=postgres
REACT_APP_PG_SSL=false

# InfluxDB Configuration
REACT_APP_INFLUX_URL=http://localhost:8086
REACT_APP_INFLUX_TOKEN=your-token
REACT_APP_INFLUX_ORG=deepseaguard
REACT_APP_INFLUX_BUCKET=telemetry

# Feature Flags
REACT_APP_ENABLE_3D_MAP=true
REACT_APP_ENABLE_REAL_TIME_ALERTS=true
REACT_APP_ENABLE_ISA_REPORTING=true
EOF

# Create a README.md file with deployment instructions
echo "Creating README with deployment instructions..."
cat > README.md << EOF
# DeepSeaGuard Compliance Dashboard

A real-time monitoring and compliance reporting dashboard for Triton Mining Co's deep-sea mining operations.

## Features

- **3D Visualization**: Real-time 3D map of AUV positions, seafloor bathymetry, and sediment plumes
- **Environmental Monitoring**: Track water quality, sediment disturbance, and species proximity
- **Operational Data**: Monitor AUV status, mission progress, and collection efficiency
- **ISA Compliance**: Track compliance with International Seabed Authority standards
- **Alert Management**: Real-time notification system for environmental and operational alerts
- **Reporting**: Generate ISA-compliant reports in multiple formats

## Technology Stack

- **Frontend**: React, Three.js, Chart.js
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (relational data), InfluxDB (time-series data)
- **Real-time Communication**: WebSockets

## Installation

1. Clone the repository:
   \`\`\`
   git clone https://github.com/tritoncorp/deepseaguard.git
   cd deepseaguard
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

3. Configure environment variables:
   \`\`\`
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. Start development server:
   \`\`\`
   npm run dev
   \`\`\`

## Deployment

### Production Deployment

1. Build the application:
   \`\`\`
   npm run build
   \`\`\`

2. Deploy using the deployment script:
   \`\`\`
   npm run deploy
   \`\`\`

### Manual Deployment

1. Build the application:
   \`\`\`
   npm run build
   \`\`\`

2. Copy the \`dist\` directory to your web server:
   \`\`\`
   cp -r dist/* /var/www/deepseaguard/
   \`\`\`

3. Configure your web server (Nginx example provided in \`deploy.sh\`)

## Testing

- Run unit tests:
  \`\`\`
  npm test
  \`\`\`

- Run security validation:
  \`\`\`
  npm run security
  \`\`\`

- Run all tests and generate report:
  \`\`\`
  node src/tests/run_tests.js
  \`\`\`

## Documentation

- [User Guide](docs/user_guide.md)
- [API Documentation](docs/api_docs.md)
- [ISA Compliance Standards](docs/isa_standards.md)

## License

© 2025 Triton Mining Co. All rights reserved.
EOF

# Create a documentation directory with basic guides
mkdir -p docs
echo "Creating documentation..."

cat > docs/user_guide.md << EOF
# DeepSeaGuard User Guide

## Getting Started

1. **Login**: Access the dashboard at https://deepseaguard.tritoncorp.com and log in with your credentials
2. **Dashboard Overview**: The main dashboard displays real-time monitoring of all AUVs and environmental metrics
3. **Navigation**: Use the left sidebar to navigate between different sections

## Main Features

### 3D Map View

The 3D map provides a real-time visualization of:
- AUV positions and status
- Seafloor bathymetry
- Sediment plumes
- ISA zones and sensitive ecological areas

Controls:
- Use mouse to rotate, pan, and zoom
- Toggle layers using the layer controls
- Switch between different view modes (Top, Side, Follow AUV, Free)
- Click on AUVs to select and view detailed information

### Environmental Metrics

Monitor key environmental parameters:
- Sediment disturbance levels
- Water quality metrics (turbidity, pH, temperature, dissolved oxygen)
- Species proximity alerts

### Operational Data

Track operational status of AUVs:
- Position and depth
- Mission status and completion rate
- Collection efficiency
- Battery levels and estimated remaining time

### Compliance Status

Monitor ISA compliance:
- Current status of all ISA standards
- Reporting timeline and status
- Generate and download compliance reports

### Alert System

Manage system alerts:
- View active alerts sorted by severity
- Acknowledge and resolve alerts
- View alert history and resolution details

## User Roles

- **Viewer**: Can view all dashboard data but cannot modify settings or acknowledge alerts
- **Operator**: Can view data and acknowledge/resolve alerts
- **Compliance Officer**: Can generate and submit ISA reports
- **Administrator**: Full access to all features and settings

## Troubleshooting

If you encounter any issues:
1. Check your internet connection
2. Verify that you have the correct permissions for the action
3. Contact support at support@tritoncorp.com
EOF

cat > docs/api_docs.md << EOF
# DeepSeaGuard API Documentation

## Authentication

All API requests require authentication using JWT tokens.

**Login**:
\`\`\`
POST /api/auth/login
Body: { "username": "user", "password": "pass" }
Response: { "token": "jwt_token", "user": {...} }
\`\`\`

**Validate Token**:
\`\`\`
GET /api/auth/validate
Headers: { "Authorization": "Bearer jwt_token" }
Response: { "valid": true, "user": {...} }
\`\`\`

**Logout**:
\`\`\`
POST /api/auth/logout
Headers: { "Authorization": "Bearer jwt_token" }
\`\`\`

## AUV Data

**Get All AUVs**:
\`\`\`
GET /api/auvs
Response: [{ "id": "AUV-001", "name": "Explorer-1", ... }]
\`\`\`

**Get AUV Details**:
\`\`\`
GET /api/auvs/{auvId}
Response: { "id": "AUV-001", "name": "Explorer-1", ... }
\`\`\`

**Get AUV Position History**:
\`\`\`
GET /api/auvs/{auvId}/positions?start_time=2025-05-01T00:00:00Z&end_time=2025-05-02T00:00:00Z
Response: { "positions": [...] }
\`\`\`

**Send Command to AUV**:
\`\`\`
POST /api/auvs/{auvId}/command
Body: { "command": "stop", "parameters": {...} }
Response: { "success": true, "message": "Command sent" }
\`\`\`

## Environmental Data

**Get Current Environmental Data**:
\`\`\`
GET /api/environmental
Response: { "sedimentDisturbance": {...}, "waterQuality": {...}, ... }
\`\`\`

**Get Historical Environmental Data**:
\`\`\`
GET /api/environmental/{metric}/history?start_time=2025-05-01T00:00:00Z&end_time=2025-05-02T00:00:00Z
Response: { "history": [...] }
\`\`\`

**Get Species Alerts**:
\`\`\`
GET /api/environmental/species
Response: { "alerts": [...] }
\`\`\`

## Operational Data

**Get Current Operational Data**:
\`\`\`
GET /api/operational/{auvId}
Response: { "position": {...}, "mission": {...}, ... }
\`\`\`

**Get Mission Details**:
\`\`\`
GET /api/operational/missions/{missionId}
Response: { "id": "MSN-001", "status": "in-progress", ... }
\`\`\`

## Compliance Data

**Get Current Compliance Status**:
\`\`\`
GET /api/compliance
Response: { "isaStandards": [...], "reportingStatus": {...} }
\`\`\`

**Generate Compliance Report**:
\`\`\`
POST /api/compliance/reports/generate
Body: { "reportType": "monthly", "format": "pdf", "parameters": {...} }
Response: { "reportId": "ISA-MONTHLY-2025-05", "downloadUrl": "..." }
\`\`\`

**Get Report List**:
\`\`\`
GET /api/compliance/reports
Response: { "reports": [...] }
\`\`\`

## Alert Management

**Get Active Alerts**:
\`\`\`
GET /api/alerts/active
Response: [{ "id": "ALT-001", "type": "environmental", ... }]
\`\`\`

**Get Alert History**:
\`\`\`
GET /api/alerts/history?start_time=2025-05-01T00:00:00Z&end_time=2025-05-02T00:00:00Z
Response: [{ "id": "ALT-001", "type": "environmental", ... }]
\`\`\`

**Acknowledge Alert**:
\`\`\`
POST /api/alerts/{alertId}/acknowledge
Response: { "success": true, "alert": {...} }
\`\`\`

**Resolve Alert**:
\`\`\`
POST /api/alerts/{alertId}/resolve
Body: { "resolution": "Issue fixed by adjusting parameters" }
Response: { "success": true, "alert": {...} }
\`\`\`

## WebSocket API

Connect to WebSocket for real-time updates:
\`\`\`
WebSocket: wss://api.deepseaguard.com/ws/{channel}?token={jwt_token}
Channels: auvs, environmental, operational/{auvId}, compliance, alerts
\`\`\`
EOF

cat > docs/isa_standards.md << EOF
# ISA Compliance Standards

The International Seabed Authority (ISA) has established environmental regulations for deep-sea mining operations. DeepSeaGuard monitors compliance with these standards in real-time.

## Environmental Standards

### ISA-ENV-1: Sediment Discharge Limit
- **Description**: Maximum allowable sediment discharge concentration
- **Threshold**: 25 mg/L
- **Monitoring**: Continuous real-time monitoring via AUV sensors
- **Reporting**: Required in monthly reports with daily averages

### ISA-ENV-2: Protected Species Proximity
- **Description**: Minimum distance to maintain from protected species
- **Threshold**: 100 meters
- **Monitoring**: Real-time detection via AUV cameras and sonar
- **Reporting**: Immediate alerts and incident reports for any violations

### ISA-ENV-3: Noise Level Limit
- **Description**: Maximum noise level during operations
- **Threshold**: 60 dB
- **Monitoring**: Continuous monitoring via hydrophones
- **Reporting**: Required in monthly reports with hourly averages

## Operational Standards

### ISA-OPS-1: Collection Efficiency
- **Description**: Minimum efficiency rate for nodule collection
- **Threshold**: 80%
- **Monitoring**: Calculated based on collection rates and waste
- **Reporting**: Required in monthly reports

## Reporting Requirements

### Monthly Reports
- Due by the 5th day of the following month
- Must include:
  - Daily averages of all environmental metrics
  - Compliance status for all standards
  - Incident reports for any violations
  - Mitigation measures taken

### Quarterly Reports
- Due by the 15th day following the end of each quarter
- Must include:
  - Monthly summaries of all environmental metrics
  - Trend analysis of environmental impact
  - Updates on mitigation strategies

### Annual Reports
- Due by January 31st for the previous year
- Must include:
  - Comprehensive environmental impact assessment
  - Comparison with baseline data
  - Long-term trend analysis
  - Proposed improvements for the coming year

## Data Format Requirements

All submitted data must be:
- Digital and machine-readable
- Georeferenced where applicable
- Time-stamped with UTC time
- Provided in both raw and processed formats
- Accompanied by metadata describing collection methods
EOF

# Create a zip file of the entire project
echo "Creating project zip file..."
cd ..
zip -r deepseaguard_dashboard_complete.zip deepseaguard

echo "Setup complete! Project is ready for deployment."
