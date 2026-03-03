import { dijkstra, aStar } from './algorithms';
import { getGraph } from '../data/indoorMap';

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

  if (useAstar) {
    return aStar(graph, startLocationId, endLocationId, heuristic);
  } else {
    return dijkstra(graph, startLocationId, endLocationId);
  }
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

  return shortestRoute;
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
