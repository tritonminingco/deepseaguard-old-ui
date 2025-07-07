# WebSocket Real-time Data Streaming Service
# Streams live AUV telemetry data to frontend clients

from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import json
import threading
import time
from datetime import datetime
from typing import Dict, List
from src.models.simulation_engine import AUVSimulator, ScenarioManager
from src.models.data_schema import serialize_telemetry

class RealTimeDataService:
    """Manages real-time data streaming to clients"""
    
    def __init__(self, app: Flask, socketio: SocketIO):
        self.app = app
        self.socketio = socketio
        self.clients = {}  # Track connected clients
        self.simulators = {}  # AUV simulators
        self.scenario_manager = None
        self.streaming_thread = None
        self.is_streaming = False
        
        # Initialize AUV simulators
        self.initialize_simulators()
        
        # Setup WebSocket event handlers
        self.setup_websocket_handlers()
        
    def initialize_simulators(self):
        """Initialize AUV simulators"""
        auv_configs = [
            {
                "auv_id": "AUV-001",
                "auv_name": "Deep Explorer",
                "manufacturer": "Kongsberg",
                "model": "HUGIN Superior"
            },
            {
                "auv_id": "AUV-002", 
                "auv_name": "Ocean Surveyor",
                "manufacturer": "Saab",
                "model": "Sabertooth"
            },
            {
                "auv_id": "AUV-003",
                "auv_name": "Abyss Collector", 
                "manufacturer": "Bluefin",
                "model": "Sandshark"
            }
        ]
        
        for config in auv_configs:
            simulator = AUVSimulator(
                config["auv_id"],
                config["auv_name"], 
                config["manufacturer"],
                config["model"]
            )
            self.simulators[config["auv_id"]] = simulator
        
        # Initialize scenario manager
        self.scenario_manager = ScenarioManager(list(self.simulators.values()))
        
        print(f"Initialized {len(self.simulators)} AUV simulators")
    
    def setup_websocket_handlers(self):
        """Setup WebSocket event handlers"""
        
        @self.socketio.on('connect')
        def handle_connect():
            """Handle client connection"""
            client_id = request.sid if 'request' in globals() else 'unknown'
            self.clients[client_id] = {
                'connected_at': datetime.now().isoformat(),
                'subscriptions': []
            }
            
            print(f"Client {client_id} connected")
            
            # Send initial data
            self.send_initial_data(client_id)
            
            # Start streaming if not already running
            if not self.is_streaming:
                self.start_streaming()
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """Handle client disconnection"""
            client_id = request.sid if 'request' in globals() else 'unknown'
            if client_id in self.clients:
                del self.clients[client_id]
            
            print(f"Client {client_id} disconnected")
            
            # Stop streaming if no clients
            if not self.clients and self.is_streaming:
                self.stop_streaming()
        
        @self.socketio.on('subscribe_auv')
        def handle_subscribe_auv(data):
            """Handle AUV subscription"""
            client_id = request.sid if 'request' in globals() else 'unknown'
            auv_id = data.get('auv_id')
            
            if client_id in self.clients and auv_id in self.simulators:
                if auv_id not in self.clients[client_id]['subscriptions']:
                    self.clients[client_id]['subscriptions'].append(auv_id)
                    join_room(f"auv_{auv_id}")
                    
                    print(f"Client {client_id} subscribed to {auv_id}")
                    
                    # Send current data for this AUV
                    telemetry = self.simulators[auv_id].generate_telemetry()
                    emit('auv_telemetry', {
                        'auv_id': auv_id,
                        'data': telemetry.__dict__
                    })
        
        @self.socketio.on('unsubscribe_auv')
        def handle_unsubscribe_auv(data):
            """Handle AUV unsubscription"""
            client_id = request.sid if 'request' in globals() else 'unknown'
            auv_id = data.get('auv_id')
            
            if client_id in self.clients and auv_id in self.clients[client_id]['subscriptions']:
                self.clients[client_id]['subscriptions'].remove(auv_id)
                leave_room(f"auv_{auv_id}")
                
                print(f"Client {client_id} unsubscribed from {auv_id}")
        
        @self.socketio.on('trigger_scenario')
        def handle_trigger_scenario(data):
            """Handle scenario triggering (for demo purposes)"""
            auv_id = data.get('auv_id')
            scenario = data.get('scenario')
            
            if auv_id in self.simulators:
                self.simulators[auv_id].trigger_scenario(scenario)
                
                print(f"Triggered scenario '{scenario}' for {auv_id}")
                
                # Notify clients
                self.socketio.emit('scenario_triggered', {
                    'auv_id': auv_id,
                    'scenario': scenario,
                    'timestamp': datetime.now().isoformat()
                })
        
        @self.socketio.on('start_investor_demo')
        def handle_start_investor_demo():
            """Start the investor demo sequence"""
            self.scenario_manager.setup_investor_demo()
            
            print("Started investor demo sequence")
            
            # Notify all clients
            self.socketio.emit('demo_started', {
                'message': 'Investor demo sequence initiated',
                'timestamp': datetime.now().isoformat()
            })
        
        @self.socketio.on('get_auv_list')
        def handle_get_auv_list():
            """Send list of available AUVs"""
            auv_list = []
            for auv_id, simulator in self.simulators.items():
                auv_list.append({
                    'auv_id': auv_id,
                    'auv_name': simulator.auv_name,
                    'manufacturer': simulator.manufacturer,
                    'model': simulator.model,
                    'status': 'active'
                })
            
            emit('auv_list', {'auvs': auv_list})
    
    def send_initial_data(self, client_id: str):
        """Send initial data to newly connected client"""
        # Send AUV list
        auv_list = []
        for auv_id, simulator in self.simulators.items():
            auv_list.append({
                'auv_id': auv_id,
                'auv_name': simulator.auv_name,
                'manufacturer': simulator.manufacturer,
                'model': simulator.model,
                'status': 'active'
            })
        
        self.socketio.emit('auv_list', {'auvs': auv_list}, room=client_id)
        
        # Send current telemetry for all AUVs
        for auv_id, simulator in self.simulators.items():
            telemetry = simulator.generate_telemetry()
            self.socketio.emit('auv_telemetry', {
                'auv_id': auv_id,
                'data': self.telemetry_to_dict(telemetry)
            }, room=client_id)
    
    def telemetry_to_dict(self, telemetry) -> Dict:
        """Convert telemetry object to dictionary for JSON serialization"""
        def convert_dataclass(obj):
            if hasattr(obj, '__dict__'):
                result = {}
                for key, value in obj.__dict__.items():
                    if hasattr(value, '__dict__'):
                        result[key] = convert_dataclass(value)
                    elif isinstance(value, list):
                        result[key] = [convert_dataclass(item) if hasattr(item, '__dict__') else item for item in value]
                    else:
                        result[key] = value
                return result
            return obj
        
        return convert_dataclass(telemetry)
    
    def start_streaming(self):
        """Start the real-time data streaming thread"""
        if self.is_streaming:
            return
        
        self.is_streaming = True
        self.streaming_thread = threading.Thread(target=self._streaming_loop)
        self.streaming_thread.daemon = True
        self.streaming_thread.start()
        
        print("Started real-time data streaming")
    
    def stop_streaming(self):
        """Stop the real-time data streaming"""
        self.is_streaming = False
        if self.streaming_thread:
            self.streaming_thread.join(timeout=1)
        
        print("Stopped real-time data streaming")
    
    def _streaming_loop(self):
        """Main streaming loop - runs in separate thread"""
        while self.is_streaming:
            try:
                # Update scenarios
                if self.scenario_manager:
                    self.scenario_manager.update_scenarios()
                
                # Generate and broadcast telemetry for each AUV
                for auv_id, simulator in self.simulators.items():
                    telemetry = simulator.generate_telemetry()
                    
                    # Broadcast to all clients subscribed to this AUV
                    self.socketio.emit('auv_telemetry', {
                        'auv_id': auv_id,
                        'data': self.telemetry_to_dict(telemetry)
                    }, room=f"auv_{auv_id}")
                    
                    # Also broadcast to general room
                    self.socketio.emit('telemetry_update', {
                        'auv_id': auv_id,
                        'timestamp': telemetry.timestamp,
                        'position': {
                            'latitude': telemetry.position.latitude,
                            'longitude': telemetry.position.longitude,
                            'depth': telemetry.position.depth
                        },
                        'alerts': len(telemetry.active_alerts),
                        'compliance_score': telemetry.compliance.environmental_impact_score
                    })
                
                # Broadcast system status
                self.socketio.emit('system_status', {
                    'timestamp': datetime.now().isoformat(),
                    'active_auvs': len(self.simulators),
                    'connected_clients': len(self.clients),
                    'streaming': True
                })
                
                # Wait for next update (5 second intervals)
                time.sleep(5)
                
            except Exception as e:
                print(f"Error in streaming loop: {e}")
                time.sleep(1)  # Brief pause before retry

# WebSocket event handlers for Flask-SocketIO
def create_websocket_service(app: Flask) -> tuple[SocketIO, RealTimeDataService]:
    """Create and configure WebSocket service"""
    
    # Configure CORS for WebSocket
    socketio = SocketIO(
        app,
        cors_allowed_origins="*",
        async_mode='threading',
        logger=True,
        engineio_logger=True
    )
    
    # Create real-time data service
    data_service = RealTimeDataService(app, socketio)
    
    return socketio, data_service

# REST API endpoints for WebSocket management
def create_websocket_routes(app: Flask, data_service: RealTimeDataService):
    """Create REST API routes for WebSocket management"""
    
    @app.route('/api/websocket/status', methods=['GET'])
    def websocket_status():
        """Get WebSocket service status"""
        return {
            'status': 'active' if data_service.is_streaming else 'inactive',
            'connected_clients': len(data_service.clients),
            'active_auvs': len(data_service.simulators),
            'timestamp': datetime.now().isoformat()
        }
    
    @app.route('/api/websocket/auvs', methods=['GET'])
    def get_auvs():
        """Get list of available AUVs"""
        auv_list = []
        for auv_id, simulator in data_service.simulators.items():
            auv_list.append({
                'auv_id': auv_id,
                'auv_name': simulator.auv_name,
                'manufacturer': simulator.manufacturer,
                'model': simulator.model,
                'status': 'active'
            })
        
        return {'auvs': auv_list}
    
    @app.route('/api/websocket/scenario/<auv_id>/<scenario>', methods=['POST'])
    def trigger_scenario(auv_id: str, scenario: str):
        """Trigger a scenario for specific AUV"""
        if auv_id in data_service.simulators:
            data_service.simulators[auv_id].trigger_scenario(scenario)
            return {
                'success': True,
                'message': f'Triggered scenario {scenario} for {auv_id}',
                'timestamp': datetime.now().isoformat()
            }
        else:
            return {
                'success': False,
                'error': f'AUV {auv_id} not found'
            }, 404
    
    @app.route('/api/websocket/demo/start', methods=['POST'])
    def start_demo():
        """Start investor demo sequence"""
        data_service.scenario_manager.setup_investor_demo()
        return {
            'success': True,
            'message': 'Investor demo sequence started',
            'timestamp': datetime.now().isoformat()
        }

if __name__ == "__main__":
    # Test the WebSocket service
    from flask import Flask
    
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'deepseaguard_secret_key'
    
    socketio, data_service = create_websocket_service(app)
    create_websocket_routes(app, data_service)
    
    print("Starting WebSocket test server...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

