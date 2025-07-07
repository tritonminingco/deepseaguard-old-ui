import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from src.routes.websocket_service import create_websocket_service, create_websocket_routes

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    app.config['SECRET_KEY'] = 'deepseaguard_realtime_secret_key_2024'
    
    # Enable CORS for all routes
    CORS(app, origins="*")
    
    # Create WebSocket service
    socketio, data_service = create_websocket_service(app)
    
    # Create WebSocket management routes
    create_websocket_routes(app, data_service)
    
    # Basic routes
    @app.route('/api/health')
    def health_check():
        """Health check endpoint"""
        return {
            'status': 'healthy',
            'service': 'DeepSeaGuard Real-time Backend',
            'version': '1.0.0',
            'websocket_active': data_service.is_streaming,
            'active_auvs': len(data_service.simulators)
        }
    
    @app.route('/api/telemetry/<auv_id>')
    def get_current_telemetry(auv_id):
        """Get current telemetry for specific AUV"""
        if auv_id in data_service.simulators:
            telemetry = data_service.simulators[auv_id].generate_telemetry()
            return data_service.telemetry_to_dict(telemetry)
        else:
            return {'error': f'AUV {auv_id} not found'}, 404
    
    # Serve frontend files
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        static_folder_path = app.static_folder
        if static_folder_path is None:
            return "Static folder not configured", 404

        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                return jsonify({
                    'message': 'DeepSeaGuard Real-time Backend is running',
                    'websocket_endpoint': 'ws://localhost:5000',
                    'api_endpoint': 'http://localhost:5000/api/',
                    'health_check': 'http://localhost:5000/api/health'
                })
    
    return app, socketio

if __name__ == '__main__':
    app, socketio = create_app()
    
    print("🚀 Starting DeepSeaGuard Real-time Backend...")
    print("📡 WebSocket endpoint: ws://localhost:5000")
    print("🌐 REST API: http://localhost:5000/api/")
    print("💻 Frontend should connect to: http://localhost:5000")
    
    # Run with SocketIO
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=True,
        allow_unsafe_werkzeug=True
    )

