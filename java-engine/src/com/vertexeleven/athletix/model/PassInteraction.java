package com.vertexeleven.athletix.model;

/**
 * Represents a direct passing interaction link between two players in a match.
 */
public class PassInteraction {
    private final String matchId;
    private final String sourcePlayerId;
    private final String targetPlayerId;
    private final int passCount;
    private final int successfulPassCount;

    public PassInteraction(String matchId, String sourcePlayerId, String targetPlayerId, int passCount, int successfulPassCount) {
        this.matchId = matchId;
        this.sourcePlayerId = sourcePlayerId;
        this.targetPlayerId = targetPlayerId;
        this.passCount = passCount;
        this.successfulPassCount = successfulPassCount;
    }

    public String getMatchId() {
        return matchId;
    }

    public String getSourcePlayerId() {
        return sourcePlayerId;
    }

    public String getTargetPlayerId() {
        return targetPlayerId;
    }

    public int getPassCount() {
        return passCount;
    }

    public int getSuccessfulPassCount() {
        return successfulPassCount;
    }
}
