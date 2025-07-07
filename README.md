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
   ```
   git clone https://github.com/tritoncorp/deepseaguard.git
   cd deepseaguard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   ```
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start development server:
   ```
   npm run dev
   ```

## Deployment

### Production Deployment

1. Build the application:
   ```
   npm run build
   ```

2. Deploy using the deployment script:
   ```
   npm run deploy
   ```

### Manual Deployment

1. Build the application:
   ```
   npm run build
   ```

2. Copy the `dist` directory to your web server:
   ```
   cp -r dist/* /var/www/deepseaguard/
   ```

3. Configure your web server (Nginx example provided in `deploy.sh`)

## Testing

- Run unit tests:
  ```
  npm test
  ```

- Run security validation:
  ```
  npm run security
  ```

- Run all tests and generate report:
  ```
  node src/tests/run_tests.js
  ```

## Documentation

- [User Guide](docs/user_guide.md)
- [API Documentation](docs/api_docs.md)
- [ISA Compliance Standards](docs/isa_standards.md)

## License

© 2025 Triton Mining Co. All rights reserved.
