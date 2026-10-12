package com.vertexeleven.athletix.io;

import com.vertexeleven.athletix.model.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Handles CSV ingestion and serialization for Athletix batch pipeline.
 */
public class CsvDataHandler {

    public static Map<String, Player> readPlayers(String filePath) throws IOException {
        Map<String, Player> players = new LinkedHashMap<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath, StandardCharsets.UTF_8))) {
            String line = br.readLine(); // Header
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length >= 6) {
                    String id = parts[0].trim();
                    String name = parts[1].trim();
                    String position = parts[2].trim();
                    int squadNum = Integer.parseInt(parts[3].trim());
                    String team = parts[4].trim();
                    int age = Integer.parseInt(parts[5].trim());
                    players.put(id, new Player(id, name, position, squadNum, team, age));
                }
            }
        }
        return players;
    }

    public static Map<String, Match> readMatches(String filePath) throws IOException {
        Map<String, Match> matches = new LinkedHashMap<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath, StandardCharsets.UTF_8))) {
            String line = br.readLine();
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length >= 8) {
                    String id = parts[0].trim();
                    String date = parts[1].trim();
                    String team = parts[2].trim();
                    String opp = parts[3].trim();
                    String venue = parts[4].trim();
                    int gf = Integer.parseInt(parts[5].trim());
                    int ga = Integer.parseInt(parts[6].trim());
                    String result = parts[7].trim();
                    matches.put(id, new Match(id, date, team, opp, venue, gf, ga, result));
                }
            }
        }
        return matches;
    }

    public static List<MatchPerformance> readPerformances(String filePath) throws IOException {
        List<MatchPerformance> list = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath, StandardCharsets.UTF_8))) {
            String line = br.readLine();
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length >= 13) {
                    String matchId = parts[0].trim();
                    String playerId = parts[1].trim();
                    int min = Integer.parseInt(parts[2].trim());
                    int goals = Integer.parseInt(parts[3].trim());
                    int assists = Integer.parseInt(parts[4].trim());
                    int shots = Integer.parseInt(parts[5].trim());
                    int passesAtt = Integer.parseInt(parts[6].trim());
                    int passesComp = Integer.parseInt(parts[7].trim());
                    double passAcc = Double.parseDouble(parts[8].trim());
                    int tackles = Integer.parseInt(parts[9].trim());
                    int inter = Integer.parseInt(parts[10].trim());
                    int clean = Integer.parseInt(parts[11].trim());
                    double rating = Double.parseDouble(parts[12].trim());

                    list.add(new MatchPerformance(matchId, playerId, min, goals, assists, shots,
                            passesAtt, passesComp, passAcc, tackles, inter, clean, rating));
                }
            }
        }
        return list;
    }

    public static List<PassInteraction> readPassInteractions(String filePath) throws IOException {
        List<PassInteraction> list = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath, StandardCharsets.UTF_8))) {
            String line = br.readLine();
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length >= 5) {
                    String matchId = parts[0].trim();
                    String src = parts[1].trim();
                    String tgt = parts[2].trim();
                    int count = Integer.parseInt(parts[3].trim());
                    int succ = Integer.parseInt(parts[4].trim());
                    list.add(new PassInteraction(matchId, src, tgt, count, succ));
                }
            }
        }
        return list;
    }

    public static Map<String, Double> readPerformanceScores(String filePath) throws IOException {
        Map<String, Double> scores = new HashMap<>();
        try (BufferedReader br = new BufferedReader(new FileReader(filePath, StandardCharsets.UTF_8))) {
            String line = br.readLine();
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length >= 2) {
                    String playerId = parts[0].trim();
                    double score = Double.parseDouble(parts[1].trim());
                    scores.put(playerId, score);
                }
            }
        }
        return scores;
    }

    public static void writePlayerStats(String filePath, Map<String, PlayerStats> statsMap) throws IOException {
        File file = new File(filePath);
        if (file.getParentFile() != null) file.getParentFile().mkdirs();

        try (BufferedWriter bw = new BufferedWriter(new FileWriter(file, StandardCharsets.UTF_8))) {
            bw.write("player_id,matches_played,total_minutes,goals,assists,shots," +
                    "passes_attempted,passes_completed,pass_accuracy,tackles,interceptions," +
                    "clean_sheets,recent_form,consistency_score,avg_match_rating," +
                    "total_interactions,connected_teammates,weighted_involvement,interaction_density," +
                    "goals_per_match,assists_per_match,tackles_per_match,interceptions_per_match\n");

            for (PlayerStats s : statsMap.values()) {
                bw.write(String.format(Locale.US,
                        "%s,%d,%d,%d,%d,%d,%d,%d,%.2f,%d,%d,%d,%.2f,%.2f,%.2f,%d,%d,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f\n",
                        s.getPlayerId(),
                        s.getMatchesPlayed(),
                        s.getTotalMinutes(),
                        s.getTotalGoals(),
                        s.getTotalAssists(),
                        s.getTotalShots(),
                        s.getTotalPassesAttempted(),
                        s.getTotalPassesCompleted(),
                        s.getOverallPassAccuracy(),
                        s.getTotalTackles(),
                        s.getTotalInterceptions(),
                        s.getTotalCleanSheets(),
                        s.getRecentFormScore(),
                        s.getConsistencyScore(),
                        s.getAverageMatchRating(),
                        s.getTotalInteractions(),
                        s.getConnectedTeammates(),
                        s.getWeightedInvolvement(),
                        s.getInteractionDensity(),
                        s.getGoalsPerMatch(),
                        s.getAssistsPerMatch(),
                        s.getTacklesPerMatch(),
                        s.getInterceptionsPerMatch()
                ));
            }
        }
    }

    public static void writeFinalRankings(String filePath, List<PlayerRanking> rankings) throws IOException {
        File file = new File(filePath);
        if (file.getParentFile() != null) file.getParentFile().mkdirs();

        try (BufferedWriter bw = new BufferedWriter(new FileWriter(file, StandardCharsets.UTF_8))) {
            bw.write("rank,player_id,name,position,academy_team,squad_number,performance_score,recent_form,total_interactions,tie_break_reason\n");
            for (PlayerRanking r : rankings) {
                bw.write(String.format(Locale.US,
                        "%d,%s,\"%s\",%s,\"%s\",%d,%.2f,%.2f,%d,\"%s\"\n",
                        r.getRank(),
                        r.getPlayerId(),
                        r.getName(),
                        r.getPosition(),
                        r.getAcademyTeam(),
                        r.getPlayer().getSquadNumber(),
                        r.getPerformanceScore(),
                        r.getRecentForm(),
                        r.getTotalInteractions(),
                        r.getTieBreakReason()
                ));
            }
        }
    }
}
