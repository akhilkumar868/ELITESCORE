package com.vertexeleven.athletix.model;

/**
 * Represents an academy athlete in the Athletix platform.
 * Developed by Team Vertex Eleven.
 */
public class Player {
    private final String playerId;
    private final String name;
    private final String position;
    private final int squadNumber;
    private final String academyTeam;
    private final int age;

    public Player(String playerId, String name, String position, int squadNumber, String academyTeam, int age) {
        this.playerId = playerId;
        this.name = name;
        this.position = position;
        this.squadNumber = squadNumber;
        this.academyTeam = academyTeam;
        this.age = age;
    }

    public String getPlayerId() {
        return playerId;
    }

    public String getName() {
        return name;
    }

    public String getPosition() {
        return position;
    }

    public int getSquadNumber() {
        return squadNumber;
    }

    public String getAcademyTeam() {
        return academyTeam;
    }

    public int getAge() {
        return age;
    }

    @Override
    public String toString() {
        return String.format("%s (#%d %s - %s)", name, squadNumber, position, academyTeam);
    }
}
