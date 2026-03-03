import Graph from '../logic/graph';

let indoorMap = null;

/**
 * Initialize the indoor map graph with SRI ABHINAVA VIDYATIRTHA BLOCK layout
 */
function initializeMap() {
  const graph = new Graph();

  // Add locations (nodes) - Based on the floor map
  const locations = [
    // Stairs (Entry Points & Emergency Exits)
    { id: 'left_stairs', name: 'Left Stairs', x: 20, y: 100, isExit: true },
    { id: 'right_stairs', name: 'Right Stairs', x: 80, y: 100, isExit: true },
    { id: 'stairs_right_side', name: 'Stairs (Right Side)', x: 160, y: 80, isExit: true },

    // Labs (Left Wing)
    { id: 'thermal_lab', name: 'Thermal Engineering Lab II', x: 30, y: 20 },
    { id: 'machine_tools_lab', name: 'Machine Tools Lab II', x: 30, y: 50 },
    { id: 'mech_faculty', name: 'Mech Faculty Room', x: 30, y: 80 },

    // Lecture Halls (Middle & Right)
    { id: 'lecture_a', name: 'Lecture Hall A', x: 80, y: 20 },
    { id: 'lecture_b', name: 'Lecture Hall B', x: 80, y: 50 },
    { id: 'lecture_c', name: 'Lecture Hall C', x: 150, y: 20 },
    { id: 'lecture_d', name: 'Lecture Hall D', x: 150, y: 50 },

    // Centers & Rooms
    { id: 'faculty_center', name: 'Faculty Center', x: 55, y: 70 },
    { id: 'faculty_room', name: 'Faculty Room', x: 150, y: 110 },

    // HOD Rooms (Bottom)
    { id: 'mech_hod', name: 'Mech HOD', x: 25, y: 140 },
    { id: 'ai_hod', name: 'AI HOD', x: 85, y: 140 },

    // Corridors
    { id: 'main_hall', name: 'Main Hall', x: 15, y: 70 },
    { id: 'right_hall', name: 'Right Hall', x: 130, y: 70 },

    // Toilets
    { id: 'girls_toilet', name: 'Girls Toilet', x: 5, y: 115 },
    { id: 'boys_toilet_center', name: 'Boys Toilet (Center)', x: 90, y: 115 },
    { id: 'boys_toilet_north', name: 'Boys Toilet (North)', x: 145, y: 15 },
  ];

  locations.forEach(loc => {
    graph.addNode(loc.id, loc);
  });

  // Add connections (edges) with distances in meters
  const connections = [
    // Left wing connections (starting from Left Stairs)
    ['left_stairs', 'thermal_lab', 30],
    ['left_stairs', 'machine_tools_lab', 25],
    ['thermal_lab', 'machine_tools_lab', 35],
    ['machine_tools_lab', 'mech_faculty', 30],
    ['mech_faculty', 'mech_hod', 65],

    // Left-center connections
    ['machine_tools_lab', 'main_hall', 25],
    ['main_hall', 'faculty_center', 35],
    ['mech_faculty', 'left_stairs', 20],
    ['left_stairs', 'right_stairs', 65],

    // Middle connections
    ['faculty_center', 'lecture_a', 35],
    ['lecture_a', 'lecture_b', 40],
    ['lecture_b', 'faculty_center', 35],
    ['right_stairs', 'lecture_b', 30],
    ['left_stairs', 'mech_hod', 50],
    ['right_stairs', 'ai_hod', 20],

    // Right wing connections
    ['lecture_b', 'right_hall', 55],
    ['right_hall', 'lecture_c', 50],
    ['lecture_c', 'lecture_d', 35],
    ['lecture_d', 'stairs_right_side', 65],
    ['stairs_right_side', 'faculty_room', 30],

    // Bottom connections
    ['mech_hod', 'ai_hod', 65],
    ['ai_hod', 'right_stairs', 25],

    // Toilet connections
    ['girls_toilet', 'main_hall', 25],
    ['girls_toilet', 'left_stairs', 20],
    ['boys_toilet_center', 'right_stairs', 20],
    ['boys_toilet_center', 'ai_hod', 30],
    ['boys_toilet_north', 'right_hall', 30],
    ['boys_toilet_north', 'lecture_c', 20],
  ];

  connections.forEach(([from, to, distance]) => {
    graph.addEdge(from, to, distance);
  });

  return graph;
}

/**
 * Get the indoor map graph
 */
export function getGraph() {
  if (!indoorMap) {
    indoorMap = initializeMap();
  }
  return indoorMap;
}

/**
 * Get all location names for UI
 */
export function getLocationNames() {
  const graph = getGraph();
  return graph.getAllNodes().filter(node => !node.id.includes('corridor'));
}

/**
 * Get location by ID
 */
export function getLocationById(id) {
  const graph = getGraph();
  return graph.getNode(id);
}

/**
 * Add a new location to the map
 */
export function addLocation(id, name, x, y, isExit = false) {
  const graph = getGraph();
  graph.addNode(id, { name, x, y, isExit });
}

/**
 * Add a new connection between locations
 */
export function addConnection(fromId, toId, distance) {
  const graph = getGraph();
  graph.addEdge(fromId, toId, distance);
}
