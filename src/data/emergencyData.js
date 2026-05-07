/**
 * Emergency Evacuation Data
 * Configuration for exits, assembly points, evacuation routes, and emergency contacts
 */

/** Safe exit locations with capacity and position on floor plan */
export const EMERGENCY_EXITS = [
  {
    id: 'left_stairs',
    name: 'Left Stairs (Main Exit)',
    capacity: 200,
    mapX: 130,   // SVG coordinates matching MapPage
    mapY: 445,
    direction: 'West Wing',
    description: 'Main staircase — leads to ground-floor front exit',
  },
  {
    id: 'right_stairs',
    name: 'Right Stairs (Secondary Exit)',
    capacity: 150,
    mapX: 260,
    mapY: 445,
    direction: 'Center Wing',
    description: 'Secondary staircase — leads to main courtyard',
  },
  {
    id: 'stairs_right_side',
    name: 'East Stairs (Emergency Exit)',
    capacity: 100,
    mapX: 560,
    mapY: 360,
    direction: 'East Wing',
    description: 'Emergency staircase — leads to rear assembly area',
  },
];

/** Assembly points outside the building */
export const ASSEMBLY_POINTS = [
  {
    id: 'assembly_front',
    name: 'Front Assembly Point',
    nearExit: 'left_stairs',
    description: 'Open ground in front of building — main assembly area',
    capacity: 500,
  },
  {
    id: 'assembly_courtyard',
    name: 'Courtyard Assembly Point',
    nearExit: 'right_stairs',
    description: 'Central courtyard — secondary assembly area',
    capacity: 300,
  },
  {
    id: 'assembly_rear',
    name: 'Rear Parking Assembly Point',
    nearExit: 'stairs_right_side',
    description: 'Rear parking lot — east wing assembly area',
    capacity: 200,
  },
];

/** Emergency contacts */
export const EMERGENCY_CONTACTS = [
  { name: 'Campus Security', number: '100', icon: '🛡️' },
  { name: 'Fire Department', number: '101', icon: '🚒' },
  { name: 'Ambulance', number: '108', icon: '🚑' },
  { name: 'Building Warden', number: '9876543210', icon: '🏢' },
];

/** Evacuation instructions by step */
export const EVACUATION_INSTRUCTIONS = [
  'Stay calm and do not panic',
  'Leave all belongings behind',
  'Walk — do NOT run or use the lift',
  'Follow the green evacuation arrows',
  'Assist people with disabilities',
  'Proceed to the nearest emergency exit',
  'Gather at the designated assembly point',
  'Do NOT re-enter the building until cleared',
];

/** Estimated evacuation time per meter of path (seconds) */
export const EVACUATION_PACE_SEC_PER_METRE = 0.6;

/**
 * Compute estimated evacuation time in seconds given total route distance (metres)
 */
export function estimateEvacuationTime(distanceMetres) {
  return Math.ceil(distanceMetres * EVACUATION_PACE_SEC_PER_METRE);
}

/**
 * Get the assembly point linked to an exit
 */
export function getAssemblyPointForExit(exitId) {
  return ASSEMBLY_POINTS.find(ap => ap.nearExit === exitId) || ASSEMBLY_POINTS[0];
}

/**
 * Get exit data by ID
 */
export function getExitById(exitId) {
  return EMERGENCY_EXITS.find(e => e.id === exitId) || null;
}
