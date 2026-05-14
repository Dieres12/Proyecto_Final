// src/services/gpsSimulator.js - Real-time GPS Simulation Service
// Simulates bus movement along defined routes, emitting positions via Socket.io

const prisma = require('../config/prisma');

// Guatemala City area coordinates for realistic simulation
const ROUTE_TEMPLATES = [
  {
    name: 'Ruta Norte',
    waypoints: [
      { lat: 14.6349, lng: -90.5069 }, // Zone 1 - Centro Histórico
      { lat: 14.6400, lng: -90.5100 }, // Zone 2
      { lat: 14.6450, lng: -90.5150 }, // Zone 3
      { lat: 14.6500, lng: -90.5200 }, // Zone 4
      { lat: 14.6550, lng: -90.5250 }, // Zone 5
      { lat: 14.6600, lng: -90.5300 }, // Zone 6
    ]
  },
  {
    name: 'Ruta Sur',
    waypoints: [
      { lat: 14.6100, lng: -90.5300 }, // Zone 12
      { lat: 14.6150, lng: -90.5250 }, // Zone 11
      { lat: 14.6200, lng: -90.5200 }, // Zone 10
      { lat: 14.6250, lng: -90.5150 }, // Zone 9
      { lat: 14.6300, lng: -90.5100 }, // Zone 8
      { lat: 14.6349, lng: -90.5069 }, // Zone 1
    ]
  },
  {
    name: 'Ruta Este',
    waypoints: [
      { lat: 14.6349, lng: -90.5069 }, // Centro
      { lat: 14.6320, lng: -90.4900 }, // Zone 15
      { lat: 14.6280, lng: -90.4750 }, // Zone 16
      { lat: 14.6300, lng: -90.4600 }, // Zone 14
      { lat: 14.6350, lng: -90.4500 }, // Zone 13
    ]
  }
];

// State: tracks each bus position
const busStates = new Map();

/**
 * Interpolate between two GPS points
 */
const interpolate = (from, to, fraction) => ({
  lat: from.lat + (to.lat - from.lat) * fraction,
  lng: from.lng + (to.lng - from.lng) * fraction
});

/**
 * Add small random variance to simulate GPS noise
 */
const addNoise = (coord, variance = 0.0005) => ({
  lat: coord.lat + (Math.random() - 0.5) * variance,
  lng: coord.lng + (Math.random() - 0.5) * variance
});

/**
 * Calculate heading between two points (degrees)
 */
const calculateHeading = (from, to) => {
  const dLng = to.lng - from.lng;
  const dLat = to.lat - from.lat;
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
};

/**
 * Initialize a bus in the simulator
 */
const initBusState = (busId, routeWaypoints) => {
  busStates.set(busId, {
    waypoints: routeWaypoints,
    currentWaypointIndex: 0,
    fraction: 0,
    speed: 25 + Math.random() * 20, // 25-45 km/h
    reverse: false
  });
};

/**
 * Advance bus position by one step
 */
const advanceBus = (busId) => {
  const state = busStates.get(busId);
  if (!state || state.waypoints.length < 2) return null;

  const { waypoints, currentWaypointIndex, fraction, reverse } = state;
  const stepSize = 0.05 + Math.random() * 0.05; // Variable speed

  let newFraction = fraction + stepSize;
  let newIndex = currentWaypointIndex;
  let newReverse = reverse;

  if (newFraction >= 1) {
    newFraction = 0;
    if (!reverse) {
      newIndex++;
      if (newIndex >= waypoints.length - 1) {
        newIndex = waypoints.length - 2;
        newReverse = true;
      }
    } else {
      newIndex--;
      if (newIndex < 0) {
        newIndex = 0;
        newReverse = false;
      }
    }
  }

  state.currentWaypointIndex = newIndex;
  state.fraction = newFraction;
  state.reverse = newReverse;

  const fromPoint = waypoints[newIndex];
  const toPoint = reverse ? waypoints[newIndex] : waypoints[Math.min(newIndex + 1, waypoints.length - 1)];

  const interpolated = interpolate(fromPoint, toPoint, newFraction);
  const withNoise = addNoise(interpolated);
  const heading = calculateHeading(fromPoint, toPoint);

  return {
    ...withNoise,
    speed: state.speed + (Math.random() - 0.5) * 5,
    heading: Math.round(heading)
  };
};

/**
 * Main GPS simulator loop
 */
const startGPSSimulator = async (io) => {
  try {
    // Load active buses
    const buses = await prisma.bus.findMany({
      where: { active: true },
      include: { routes: { include: { stops: { orderBy: { order: 'asc' } } } } }
    });

    if (buses.length === 0) {
      console.log('⚠️  No active buses found for GPS simulation');
      return;
    }

    // Initialize each bus with waypoints
    buses.forEach((bus, idx) => {
      let waypoints;

      // Use actual route stops if available
      if (bus.routes.length > 0 && bus.routes[0].stops.length >= 2) {
        waypoints = bus.routes[0].stops.map(stop => ({ lat: stop.lat, lng: stop.lng }));
      } else {
        // Fall back to template routes
        const template = ROUTE_TEMPLATES[idx % ROUTE_TEMPLATES.length];
        waypoints = template.waypoints;
      }

      initBusState(bus.id, waypoints);
      console.log(`🚌 GPS initialized for bus: ${bus.plate} (${waypoints.length} waypoints)`);
    });

    // GPS update loop - every 5 seconds
    setInterval(async () => {
      try {
        const updates = [];

        for (const bus of buses) {
          const position = advanceBus(bus.id);
          if (!position) continue;

          updates.push({
            busId: bus.id,
            plate: bus.plate,
            ...position,
            timestamp: new Date()
          });

          // Update bus current position
          await prisma.bus.update({
            where: { id: bus.id },
            data: {
              currentLat: position.lat,
              currentLng: position.lng,
              lastLocation: new Date()
            }
          });

          // Save GPS history (keep last 24h)
          await prisma.gPSLocation.create({
            data: {
              busId: bus.id,
              lat: position.lat,
              lng: position.lng,
              speed: position.speed,
              heading: position.heading
            }
          });
        }

        // Emit to all tracking subscribers
        if (updates.length > 0) {
          io.to('tracking').emit('gps:update', updates);
        }
      } catch (error) {
        console.error('GPS simulator error:', error.message);
      }
    }, 5000);

    console.log(`🛰️  GPS simulator running for ${buses.length} buses`);
  } catch (error) {
    console.error('Failed to start GPS simulator:', error);
  }
};

module.exports = { startGPSSimulator };
