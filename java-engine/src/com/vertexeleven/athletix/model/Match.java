package com.vertexeleven.athletix.model;

/**
 * Represents a historical match played by an academy squad.
 */
public class Match {
    private final String matchId;
    private final String date;
    private final String team;
    private final String opponent;
    private final String venue;
    private final int goalsFor;
    private final int goalsAgainst;
    private final String result;

    public Match(String matchId, String date, String team, String opponent, String venue, int goalsFor, int goalsAgainst, String result) {
        this.matchId = matchId;
        this.date = date;
        this.team = team;
        this.opponent = opponent;
        this.venue = venue;
        this.goalsFor = goalsFor;
        this.goalsAgainst = goalsAgainst;
        this.result = result;
    }

    public String getMatchId() {
        return matchId;
    }

    public String getDate() {
        return date;
    }

    public String getTeam() {
        return team;
    }

    public String getOpponent() {
        return opponent;
    }

    public String getVenue() {
        return venue;
    }

    public int getGoalsFor() {
        return goalsFor;
    }

    public int getGoalsAgainst() {
        return goalsAgainst;
    }

    public String getResult() {
        return result;
    }
}
