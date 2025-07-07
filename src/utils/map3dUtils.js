// Utility functions for 3D map data handling

/**
 * Converts latitude/longitude coordinates to 3D position
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} depth - Depth in meters (positive value)
 * @param {number} scale - Scale factor for visualization
 * @returns {Array} [x, y, z] coordinates for Three.js
 */
export function geoToPosition(lat, lng, depth, scale = 0.001) {
  // Convert lat/lng to radians
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;
  
  // Earth radius in meters
  const earthRadius = 6371000;
  
  // Calculate position on a sphere
  const x = earthRadius * Math.cos(latRad) * Math.cos(lngRad) * scale;
  const z = earthRadius * Math.cos(latRad) * Math.sin(lngRad) * scale;
  
  // Y is inverted in Three.js (up is positive)
  const y = -(depth || 0);
  
  return [x, y, z];
}

/**
 * Generates a heightmap from bathymetric data
 * @param {Array} bathymetryData - Array of depth measurements
 * @param {number} width - Width of the heightmap
 * @param {number} height - Height of the heightmap
 * @returns {Float32Array} Heightmap data for Three.js
 */
export function generateHeightmap(bathymetryData, width, height) {
  // In a real implementation, this would process actual bathymetric data
  // For now, we'll generate a simple heightmap with some random features
  
  const size = width * height;
  const data = new Float32Array(size);
  const perlin = generatePerlinNoise(width, height);
  
  for (let i = 0; i < size; i++) {
    // Base depth with some variation
    let depth = -3000 - Math.random() * 1000;
    
    // Add perlin noise for natural-looking features
    depth += perlin[i] * 500;
    
    // Add some ridges and trenches
    const x = i % width;
    const y = Math.floor(i / width);
    
    // Ridge along x = width/3
    if (Math.abs(x - width/3) < width/20) {
      depth += 800 * Math.exp(-Math.pow(x - width/3, 2) / (2 * Math.pow(width/30, 2)));
    }
    
    // Trench along y = height/2
    if (Math.abs(y - height/2) < height/15) {
      depth -= 1200 * Math.exp(-Math.pow(y - height/2, 2) / (2 * Math.pow(height/25, 2)));
    }
    
    data[i] = depth;
  }
  
  return data;
}

/**
 * Generate simple Perlin noise
 * @param {number} width - Width of the noise map
 * @param {number} height - Height of the noise map
 * @returns {Float32Array} Noise data
 */
function generatePerlinNoise(width, height) {
  const size = width * height;
  const noise = new Float32Array(size);
  
  // Generate random noise
  for (let i = 0; i < size; i++) {
    noise[i] = Math.random();
  }
  
  // Smooth the noise
  const smoothed = new Float32Array(size);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      
      // Average with neighbors
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += noise[ny * width + nx];
            count++;
          }
        }
      }
      
      smoothed[y * width + x] = sum / count;
    }
  }
  
  return smoothed;
}

/**
 * Interpolate between two values based on a factor
 * @param {number} a - First value
 * @param {number} b - Second value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Calculate distance between two 3D points
 * @param {Array} p1 - First point [x, y, z]
 * @param {Array} p2 - Second point [x, y, z]
 * @returns {number} Distance
 */
export function distance3D(p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Generate a color based on a value within a range
 * @param {number} value - Value to map to color
 * @param {number} min - Minimum value in range
 * @param {number} max - Maximum value in range
 * @returns {string} Hex color string
 */
export function valueToColor(value, min, max) {
  // Normalize value to 0-1 range
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Map to color (blue to red gradient)
  const r = Math.floor(normalized * 255);
  const g = Math.floor((1 - Math.abs(normalized - 0.5) * 2) * 255);
  const b = Math.floor((1 - normalized) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
