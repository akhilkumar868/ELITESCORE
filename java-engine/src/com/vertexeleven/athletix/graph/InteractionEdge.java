package com.vertexeleven.athletix.graph;

/**
 * Weighted undirected or directed edge representing pass volume between two players.
 */
public class InteractionEdge {
    private final String sourcePlayerId;
    private final String targetPlayerId;
    private int weight; // Total pass count exchanged
    private int successfulWeight;

    public InteractionEdge(String sourcePlayerId, String targetPlayerId, int weight, int successfulWeight) {
        this.sourcePlayerId = sourcePlayerId;
        this.targetPlayerId = targetPlayerId;
        this.weight = weight;
        this.successfulWeight = successfulWeight;
    }

    public String getSourcePlayerId() {
        return sourcePlayerId;
    }

    public String getTargetPlayerId() {
        return targetPlayerId;
    }

    public int getWeight() {
        return weight;
    }

    public int getSuccessfulWeight() {
        return successfulWeight;
    }

    public void addInteractions(int passes, int successful) {
        this.weight += passes;
        this.successfulWeight += successful;
    }
}
