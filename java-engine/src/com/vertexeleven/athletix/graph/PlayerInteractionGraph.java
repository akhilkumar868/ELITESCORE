package com.vertexeleven.athletix.graph;

import com.vertexeleven.athletix.model.PassInteraction;
import java.util.*;

/**
 * Weighted Player Interaction Graph for Athletix.
 * Built from historical pass interactions.
 * 
 * Nodes: Players
 * Edges: Passing interactions between teammates
 * Edge Weight: Cumulative number of passes
 */
public class PlayerInteractionGraph {
    private final Set<String> nodes = new HashSet<>();
    // Undirected adjacency map: source -> (target -> edge)
    private final Map<String, Map<String, InteractionEdge>> adjacencyMap = new HashMap<>();

    public void addPlayerNode(String playerId) {
        nodes.add(playerId);
        adjacencyMap.putIfAbsent(playerId, new HashMap<>());
    }

    public void recordInteraction(PassInteraction interaction) {
        String p1 = interaction.getSourcePlayerId();
        String p2 = interaction.getTargetPlayerId();
        int passes = interaction.getPassCount();
        int successful = interaction.getSuccessfulPassCount();

        if (p1.equals(p2)) return;

        addPlayerNode(p1);
        addPlayerNode(p2);

        // Symmetric undirected tracking for team passing network
        addEdgeSymmetric(p1, p2, passes, successful);
    }

    private void addEdgeSymmetric(String p1, String p2, int passes, int successful) {
        // p1 -> p2
        Map<String, InteractionEdge> p1Neighbors = adjacencyMap.get(p1);
        if (p1Neighbors.containsKey(p2)) {
            p1Neighbors.get(p2).addInteractions(passes, successful);
        } else {
            p1Neighbors.put(p2, new InteractionEdge(p1, p2, passes, successful));
        }

        // p2 -> p1
        Map<String, InteractionEdge> p2Neighbors = adjacencyMap.get(p2);
        if (p2Neighbors.containsKey(p1)) {
            p2Neighbors.get(p1).addInteractions(passes, successful);
        } else {
            p2Neighbors.put(p1, new InteractionEdge(p2, p1, passes, successful));
        }
    }

    /**
     * Total interactions: Sum of all passes exchanged with all teammates.
     */
    public int getTotalInteractions(String playerId) {
        Map<String, InteractionEdge> neighbors = adjacencyMap.get(playerId);
        if (neighbors == null) return 0;
        int sum = 0;
        for (InteractionEdge edge : neighbors.values()) {
            sum += edge.getWeight();
        }
        return sum;
    }

    /**
     * Number of connected teammates: Unique teammates this player has passed with.
     */
    public int getConnectedTeammatesCount(String playerId) {
        Map<String, InteractionEdge> neighbors = adjacencyMap.get(playerId);
        return (neighbors != null) ? neighbors.size() : 0;
    }

    /**
     * Weighted degree / player involvement metric.
     * Normalized by average interaction volume per connected teammate.
     */
    public double getWeightedInvolvement(String playerId) {
        int total = getTotalInteractions(playerId);
        int connected = getConnectedTeammatesCount(playerId);
        if (connected == 0) return 0.0;
        // Composite involvement metric: 70% total volume + 30% breadth of network
        return Math.round((total * 0.7 + (connected * 12.0) * 0.3) * 10.0) / 10.0;
    }

    /**
     * Interaction density: Average passes per connected teammate.
     */
    public double getInteractionDensity(String playerId) {
        int total = getTotalInteractions(playerId);
        int connected = getConnectedTeammatesCount(playerId);
        return connected > 0 ? Math.round(((double) total / connected) * 10.0) / 10.0 : 0.0;
    }

    public Set<String> getNodes() {
        return Collections.unmodifiableSet(nodes);
    }

    public Map<String, InteractionEdge> getNeighbors(String playerId) {
        return adjacencyMap.getOrDefault(playerId, Collections.emptyMap());
    }

    /**
     * Returns deduplicated list of edges for frontend visualization.
     */
    public List<InteractionEdge> getAllUniqueEdges() {
        List<InteractionEdge> uniqueEdges = new ArrayList<>();
        Set<String> visitedPairs = new HashSet<>();

        for (Map.Entry<String, Map<String, InteractionEdge>> entry : adjacencyMap.entrySet()) {
            String p1 = entry.getKey();
            for (Map.Entry<String, InteractionEdge> neighborEntry : entry.getValue().entrySet()) {
                String p2 = neighborEntry.getKey();
                String pairKey = (p1.compareTo(p2) < 0) ? (p1 + "-" + p2) : (p2 + "-" + p1);
                if (!visitedPairs.contains(pairKey)) {
                    visitedPairs.add(pairKey);
                    uniqueEdges.add(neighborEntry.getValue());
                }
            }
        }
        return uniqueEdges;
    }
}
