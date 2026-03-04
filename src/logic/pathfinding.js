import { dijkstra, aStar } from './algorithms';
import { getGraph } from '../data/indoorMap';

/**
 * Augment a route result with a `waypoints` array — full node objects (id, name, x, y)
 * for each node in the path. Used by ARThreeScene.js for 3D waypoint rendering.
 * Pattern inspired by FireDragonGameStudio/ARIndoorNavigation-Threejs: path points
 * are converted to Vector3 positions for THREE.Line / navCube markers.
 */
function addWaypoints(route, graph) {
  if (!route || !route.path) return route;
  route.waypoints = route.path.map(id => graph.getNode(id)).filter(Boolean);
  return route;
}

/**
 * Get the optimal route between two locations
 */
export function getRoute(startLocationId, endLocationId, useAstar = true) {
  const graph = getGraph();

  // Heuristic function for A* (Euclidean distance)
  const heuristic = (nodeId, targetId) => {
    const node1 = graph.getNode(nodeId);
    const node2 = graph.getNode(targetId);

    if (!node1 || !node2) return 0;

    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const result = useAstar
    ? aStar(graph, startLocationId, endLocationId, heuristic)
    : dijkstra(graph, startLocationId, endLocationId);

  return addWaypoints(result, graph);
}

/**
 * Get emergency evacuation route (shortest path to nearest exit)
 */
export function getEvacuationRoute(currentLocationId) {
  const graph = getGraph();
  const allNodes = graph.getAllNodes();

  // Find all exits
  const exits = allNodes.filter(node => node.isExit);

  if (exits.length === 0) {
    return { path: [], distance: Infinity };
  }

  // Find closest exit by iterating all exits and tracking shortest route
  let shortestDistance = Infinity;
  let shortestRoute = { path: [], distance: Infinity };

  for (const exit of exits) {
    const route = dijkstra(graph, currentLocationId, exit.id);
    if (route.distance < shortestDistance) {
      shortestDistance = route.distance;
      shortestRoute = route;
    }
  }

  return addWaypoints(shortestRoute, graph);
}

/**
 * Get alternative routes
 */
export function getAlternativeRoutes(startLocationId, endLocationId, count = 3) {
  const graph = getGraph();
  const routes = [];

  // For now, return main route. In production, implement k-shortest paths algorithm
  const mainRoute = dijkstra(graph, startLocationId, endLocationId);
  routes.push(mainRoute);

  return routes;
}
