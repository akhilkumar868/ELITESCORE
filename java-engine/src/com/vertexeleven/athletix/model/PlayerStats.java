package com.vertexeleven.athletix.model;

/**
 * Aggregated performance metrics and graph metrics for an academy player.
 */
public class PlayerStats {
    private final String playerId;
    private int matchesPlayed;
    private int totalMinutes;
    private int totalGoals;
    private int totalAssists;
    private int totalShots;
    private int totalPassesAttempted;
    private int totalPassesCompleted;
    private double overallPassAccuracy;
    private int totalTackles;
    private int totalInterceptions;
    private int totalCleanSheets;
    private double recentFormScore;
    private double consistencyScore;
    private double averageMatchRating;

    // Graph metrics calculated by PlayerInteractionGraph
    private int totalInteractions;
    private int connectedTeammates;
    private double weightedInvolvement;
    private double interactionDensity;

    public PlayerStats(String playerId) {
        this.playerId = playerId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public int getMatchesPlayed() {
        return matchesPlayed;
    }

    public void setMatchesPlayed(int matchesPlayed) {
        this.matchesPlayed = matchesPlayed;
    }

    public int getTotalMinutes() {
        return totalMinutes;
    }

    public void setTotalMinutes(int totalMinutes) {
        this.totalMinutes = totalMinutes;
    }

    public int getTotalGoals() {
        return totalGoals;
    }

    public void setTotalGoals(int totalGoals) {
        this.totalGoals = totalGoals;
    }

    public int getTotalAssists() {
        return totalAssists;
    }

    public void setTotalAssists(int totalAssists) {
        this.totalAssists = totalAssists;
    }

    public int getTotalShots() {
        return totalShots;
    }

    public void setTotalShots(int totalShots) {
        this.totalShots = totalShots;
    }

    public int getTotalPassesAttempted() {
        return totalPassesAttempted;
    }

    public void setTotalPassesAttempted(int totalPassesAttempted) {
        this.totalPassesAttempted = totalPassesAttempted;
    }

    public int getTotalPassesCompleted() {
        return totalPassesCompleted;
    }

    public void setTotalPassesCompleted(int totalPassesCompleted) {
        this.totalPassesCompleted = totalPassesCompleted;
    }

    public double getOverallPassAccuracy() {
        return overallPassAccuracy;
    }

    public void setOverallPassAccuracy(double overallPassAccuracy) {
        this.overallPassAccuracy = overallPassAccuracy;
    }

    public int getTotalTackles() {
        return totalTackles;
    }

    public void setTotalTackles(int totalTackles) {
        this.totalTackles = totalTackles;
    }

    public int getTotalInterceptions() {
        return totalInterceptions;
    }

    public void setTotalInterceptions(int totalInterceptions) {
        this.totalInterceptions = totalInterceptions;
    }

    public int getTotalCleanSheets() {
        return totalCleanSheets;
    }

    public void setTotalCleanSheets(int totalCleanSheets) {
        this.totalCleanSheets = totalCleanSheets;
    }

    public double getRecentFormScore() {
        return recentFormScore;
    }

    public void setRecentFormScore(double recentFormScore) {
        this.recentFormScore = recentFormScore;
    }

    public double getConsistencyScore() {
        return consistencyScore;
    }

    public void setConsistencyScore(double consistencyScore) {
        this.consistencyScore = consistencyScore;
    }

    public double getAverageMatchRating() {
        return averageMatchRating;
    }

    public void setAverageMatchRating(double averageMatchRating) {
        this.averageMatchRating = averageMatchRating;
    }

    public int getTotalInteractions() {
        return totalInteractions;
    }

    public void setTotalInteractions(int totalInteractions) {
        this.totalInteractions = totalInteractions;
    }

    public int getConnectedTeammates() {
        return connectedTeammates;
    }

    public void setConnectedTeammates(int connectedTeammates) {
        this.connectedTeammates = connectedTeammates;
    }

    public double getWeightedInvolvement() {
        return weightedInvolvement;
    }

    public void setWeightedInvolvement(double weightedInvolvement) {
        this.weightedInvolvement = weightedInvolvement;
    }

    public double getInteractionDensity() {
        return interactionDensity;
    }

    public void setInteractionDensity(double interactionDensity) {
        this.interactionDensity = interactionDensity;
    }

    public double getGoalsPerMatch() {
        return matchesPlayed > 0 ? (double) totalGoals / matchesPlayed : 0.0;
    }

    public double getAssistsPerMatch() {
        return matchesPlayed > 0 ? (double) totalAssists / matchesPlayed : 0.0;
    }

    public double getTacklesPerMatch() {
        return matchesPlayed > 0 ? (double) totalTackles / matchesPlayed : 0.0;
    }

    public double getInterceptionsPerMatch() {
        return matchesPlayed > 0 ? (double) totalInterceptions / matchesPlayed : 0.0;
    }
}
