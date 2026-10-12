package com.vertexeleven.athletix.model;

/**
 * Encapsulates an individual player's performance record in a specific match.
 */
public class MatchPerformance {
    private final String matchId;
    private final String playerId;
    private final int minutesPlayed;
    private final int goals;
    private final int assists;
    private final int shots;
    private final int passesAttempted;
    private final int passesCompleted;
    private final double passAccuracy;
    private final int tackles;
    private final int interceptions;
    private final int cleanSheet;
    private final double matchRating;

    public MatchPerformance(String matchId, String playerId, int minutesPlayed, int goals, int assists,
                            int shots, int passesAttempted, int passesCompleted, double passAccuracy,
                            int tackles, int interceptions, int cleanSheet, double matchRating) {
        this.matchId = matchId;
        this.playerId = playerId;
        this.minutesPlayed = minutesPlayed;
        this.goals = goals;
        this.assists = assists;
        this.shots = shots;
        this.passesAttempted = passesAttempted;
        this.passesCompleted = passesCompleted;
        this.passAccuracy = passAccuracy;
        this.tackles = tackles;
        this.interceptions = interceptions;
        this.cleanSheet = cleanSheet;
        this.matchRating = matchRating;
    }

    public String getMatchId() {
        return matchId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public int getMinutesPlayed() {
        return minutesPlayed;
    }

    public int getGoals() {
        return goals;
    }

    public int getAssists() {
        return assists;
    }

    public int getShots() {
        return shots;
    }

    public int getPassesAttempted() {
        return passesAttempted;
    }

    public int getPassesCompleted() {
        return passesCompleted;
    }

    public double getPassAccuracy() {
        return passAccuracy;
    }

    public int getTackles() {
        return tackles;
    }

    public int getInterceptions() {
        return interceptions;
    }

    public int getCleanSheet() {
        return cleanSheet;
    }

    public double getMatchRating() {
        return matchRating;
    }
}
