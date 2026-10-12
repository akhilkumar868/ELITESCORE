package com.vertexeleven.athletix.model;

/**
 * Holds final ranking evaluation for a player, including tie-breaking annotations.
 */
public class PlayerRanking {
    private final Player player;
    private final double performanceScore;
    private final double recentForm;
    private final int totalInteractions;
    private int rank;
    private String tieBreakReason;

    public PlayerRanking(Player player, double performanceScore, double recentForm, int totalInteractions) {
        this.player = player;
        this.performanceScore = performanceScore;
        this.recentForm = recentForm;
        this.totalInteractions = totalInteractions;
        this.rank = 0;
        this.tieBreakReason = "Direct Score";
    }

    public Player getPlayer() {
        return player;
    }

    public String getPlayerId() {
        return player.getPlayerId();
    }

    public String getName() {
        return player.getName();
    }

    public String getPosition() {
        return player.getPosition();
    }

    public String getAcademyTeam() {
        return player.getAcademyTeam();
    }

    public double getPerformanceScore() {
        return performanceScore;
    }

    public double getRecentForm() {
        return recentForm;
    }

    public int getTotalInteractions() {
        return totalInteractions;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public String getTieBreakReason() {
        return tieBreakReason;
    }

    public void setTieBreakReason(String tieBreakReason) {
        this.tieBreakReason = tieBreakReason;
    }
}
