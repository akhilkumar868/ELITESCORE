package com.vertexeleven.athletix.io;

import com.vertexeleven.athletix.graph.InteractionEdge;
import com.vertexeleven.athletix.graph.PlayerInteractionGraph;
import com.vertexeleven.athletix.model.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Generates the unified Athletix static master data JSON for the React frontend.
 * Ensures the React dashboard functions 100% statically without backend servers.
 */
public class JsonDataExporter {

    public static void exportMasterData(
            String outputPath,
            Map<String, Player> players,
            Map<String, PlayerStats> statsMap,
            List<PlayerRanking> allRankings,
            List<PlayerRanking> top3,
            List<PlayerRanking> top5,
            List<PlayerRanking> top10,
            PlayerInteractionGraph graph,
            List<MatchPerformance> performances,
            Map<String, Match> matchesMap
    ) throws IOException {

        File file = new File(outputPath);
        if (file.getParentFile() != null) file.getParentFile().mkdirs();

        StringBuilder sb = new StringBuilder();
        sb.append("{\n");

        // Metadata
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        sb.append("  \"meta\": {\n");
        sb.append("    \"platform\": \"Athletix - Sports Academy Analytics\",\n");
        sb.append("    \"team\": \"Vertex Eleven\",\n");
        sb.append("    \"batchProcessedAt\": \"").append(now).append("\",\n");
        sb.append("    \"dataset\": \"Synthetic Demo Dataset\",\n");
        sb.append("    \"pipelineArchitecture\": \"Historical Match Data -> Java OOP & Graph -> Python Regression -> Java PriorityQueue Heap -> React UI\"\n");
        sb.append("  },\n");

        // KPI Summary
        double totalScoreSum = 0;
        for (PlayerRanking r : allRankings) {
            totalScoreSum += r.getPerformanceScore();
        }
        double avgScore = allRankings.isEmpty() ? 0.0 : totalScoreSum / allRankings.size();
        PlayerRanking topPlayer = allRankings.isEmpty() ? null : allRankings.get(0);

        sb.append("  \"summary\": {\n");
        sb.append("    \"totalPlayers\": ").append(players.size()).append(",\n");
        sb.append("    \"matchesAnalyzed\": ").append(matchesMap.size()).append(",\n");
        sb.append("    \"totalInteractions\": ").append(getTotalGraphInteractions(graph)).append(",\n");
        sb.append(String.format(Locale.US, "    \"avgPerformanceScore\": %.2f,\n", avgScore));
        sb.append("    \"topPlayer\": ").append(topPlayer != null ? rankingToJson(topPlayer, statsMap.get(topPlayer.getPlayerId())) : "null").append("\n");
        sb.append("  },\n");

        // Rankings sets
        sb.append("  \"top3\": ").append(rankingsListToJson(top3, statsMap)).append(",\n");
        sb.append("  \"top5\": ").append(rankingsListToJson(top5, statsMap)).append(",\n");
        sb.append("  \"top10\": ").append(rankingsListToJson(top10, statsMap)).append(",\n");
        sb.append("  \"allRankings\": ").append(rankingsListToJson(allRankings, statsMap)).append(",\n");

        // Full player profiles
        sb.append("  \"players\": [\n");
        int pIndex = 0;
        for (Player p : players.values()) {
            PlayerStats s = statsMap.get(p.getPlayerId());
            PlayerRanking r = findRanking(allRankings, p.getPlayerId());
            sb.append("    {\n");
            sb.append("      \"playerId\": \"").append(p.getPlayerId()).append("\",\n");
            sb.append("      \"name\": \"").append(escape(p.getName())).append("\",\n");
            sb.append("      \"position\": \"").append(p.getPosition()).append("\",\n");
            sb.append("      \"squadNumber\": ").append(p.getSquadNumber()).append(",\n");
            sb.append("      \"academyTeam\": \"").append(escape(p.getAcademyTeam())).append("\",\n");
            sb.append("      \"age\": ").append(p.getAge()).append(",\n");
            sb.append("      \"rank\": ").append(r != null ? r.getRank() : 0).append(",\n");
            sb.append(String.format(Locale.US, "      \"performanceScore\": %.2f,\n", r != null ? r.getPerformanceScore() : 0.0));
            sb.append(String.format(Locale.US, "      \"recentForm\": %.2f,\n", s != null ? s.getRecentFormScore() : 0.0));
            sb.append(String.format(Locale.US, "      \"consistencyScore\": %.2f,\n", s != null ? s.getConsistencyScore() : 0.0));
            sb.append(String.format(Locale.US, "      \"avgMatchRating\": %.2f,\n", s != null ? s.getAverageMatchRating() : 0.0));
            sb.append("      \"matchesPlayed\": ").append(s != null ? s.getMatchesPlayed() : 0).append(",\n");
            sb.append("      \"totalMinutes\": ").append(s != null ? s.getTotalMinutes() : 0).append(",\n");
            sb.append("      \"goals\": ").append(s != null ? s.getTotalGoals() : 0).append(",\n");
            sb.append("      \"assists\": ").append(s != null ? s.getTotalAssists() : 0).append(",\n");
            sb.append("      \"shots\": ").append(s != null ? s.getTotalShots() : 0).append(",\n");
            sb.append("      \"passesAttempted\": ").append(s != null ? s.getTotalPassesAttempted() : 0).append(",\n");
            sb.append("      \"passesCompleted\": ").append(s != null ? s.getTotalPassesCompleted() : 0).append(",\n");
            sb.append(String.format(Locale.US, "      \"passAccuracy\": %.2f,\n", s != null ? s.getOverallPassAccuracy() : 0.0));
            sb.append("      \"tackles\": ").append(s != null ? s.getTotalTackles() : 0).append(",\n");
            sb.append("      \"interceptions\": ").append(s != null ? s.getTotalInterceptions() : 0).append(",\n");
            sb.append("      \"cleanSheets\": ").append(s != null ? s.getTotalCleanSheets() : 0).append(",\n");
            sb.append("      \"totalInteractions\": ").append(s != null ? s.getTotalInteractions() : 0).append(",\n");
            sb.append("      \"connectedTeammates\": ").append(s != null ? s.getConnectedTeammates() : 0).append(",\n");
            sb.append(String.format(Locale.US, "      \"weightedInvolvement\": %.2f,\n", s != null ? s.getWeightedInvolvement() : 0.0));
            sb.append(String.format(Locale.US, "      \"interactionDensity\": %.2f\n", s != null ? s.getInteractionDensity() : 0.0));
            sb.append("    }").append(++pIndex < players.size() ? ",\n" : "\n");
        }
        sb.append("  ],\n");

        // Interaction Graph Export (Nodes + Links)
        sb.append("  \"network\": {\n");
        sb.append("    \"nodes\": [\n");
        int nodeIndex = 0;
        for (Player p : players.values()) {
            PlayerStats s = statsMap.get(p.getPlayerId());
            PlayerRanking r = findRanking(allRankings, p.getPlayerId());
            sb.append("      {\n");
            sb.append("        \"id\": \"").append(p.getPlayerId()).append("\",\n");
            sb.append("        \"name\": \"").append(escape(p.getName())).append("\",\n");
            sb.append("        \"position\": \"").append(p.getPosition()).append("\",\n");
            sb.append("        \"team\": \"").append(escape(p.getAcademyTeam())).append("\",\n");
            sb.append("        \"squadNumber\": ").append(p.getSquadNumber()).append(",\n");
            sb.append("        \"rank\": ").append(r != null ? r.getRank() : 0).append(",\n");
            sb.append(String.format(Locale.US, "        \"score\": %.2f,\n", r != null ? r.getPerformanceScore() : 0.0));
            sb.append("        \"totalInteractions\": ").append(s != null ? s.getTotalInteractions() : 0).append(",\n");
            sb.append("        \"connectedTeammates\": ").append(s != null ? s.getConnectedTeammates() : 0).append(",\n");
            sb.append(String.format(Locale.US, "        \"weightedInvolvement\": %.2f\n", s != null ? s.getWeightedInvolvement() : 0.0));
            sb.append("      }").append(++nodeIndex < players.size() ? ",\n" : "\n");
        }
        sb.append("    ],\n");

        sb.append("    \"links\": [\n");
        List<InteractionEdge> edges = graph.getAllUniqueEdges();
        for (int i = 0; i < edges.size(); i++) {
            InteractionEdge edge = edges.get(i);
            sb.append("      {\n");
            sb.append("        \"source\": \"").append(edge.getSourcePlayerId()).append("\",\n");
            sb.append("        \"target\": \"").append(edge.getTargetPlayerId()).append("\",\n");
            sb.append("        \"weight\": ").append(edge.getWeight()).append(",\n");
            sb.append("        \"successful\": ").append(edge.getSuccessfulWeight()).append("\n");
            sb.append("      }").append(i < edges.size() - 1 ? ",\n" : "\n");
        }
        sb.append("    ]\n");
        sb.append("  },\n");

        // Match Performances grouped by player for match-by-match trend charts
        sb.append("  \"playerMatchLogs\": {\n");
        Map<String, List<MatchPerformance>> playerLogs = new HashMap<>();
        for (MatchPerformance mp : performances) {
            playerLogs.computeIfAbsent(mp.getPlayerId(), k -> new ArrayList<>()).add(mp);
        }
        int plIndex = 0;
        for (Map.Entry<String, List<MatchPerformance>> entry : playerLogs.entrySet()) {
            String pid = entry.getKey();
            List<MatchPerformance> logs = entry.getValue();
            sb.append("    \"").append(pid).append("\": [\n");
            for (int j = 0; j < logs.size(); j++) {
                MatchPerformance log = logs.get(j);
                Match m = matchesMap.get(log.getMatchId());
                sb.append("      {\n");
                sb.append("        \"matchId\": \"").append(log.getMatchId()).append("\",\n");
                sb.append("        \"date\": \"").append(m != null ? m.getDate() : "").append("\",\n");
                sb.append("        \"opponent\": \"").append(m != null ? escape(m.getOpponent()) : "").append("\",\n");
                sb.append("        \"result\": \"").append(m != null ? m.getResult() : "").append("\",\n");
                sb.append("        \"minutes\": ").append(log.getMinutesPlayed()).append(",\n");
                sb.append("        \"goals\": ").append(log.getGoals()).append(",\n");
                sb.append("        \"assists\": ").append(log.getAssists()).append(",\n");
                sb.append("        \"shots\": ").append(log.getShots()).append(",\n");
                sb.append("        \"passesCompleted\": ").append(log.getPassesCompleted()).append(",\n");
                sb.append(String.format(Locale.US, "        \"passAccuracy\": %.1f,\n", log.getPassAccuracy()));
                sb.append("        \"tackles\": ").append(log.getTackles()).append(",\n");
                sb.append("        \"interceptions\": ").append(log.getInterceptions()).append(",\n");
                sb.append(String.format(Locale.US, "        \"rating\": %.1f\n", log.getMatchRating()));
                sb.append("      }").append(j < logs.size() - 1 ? ",\n" : "\n");
            }
            sb.append("    ]").append(++plIndex < playerLogs.size() ? ",\n" : "\n");
        }
        sb.append("  },\n");

        // Matches list
        sb.append("  \"matches\": [\n");
        int mIndex = 0;
        for (Match m : matchesMap.values()) {
            sb.append("    {\n");
            sb.append("      \"matchId\": \"").append(m.getMatchId()).append("\",\n");
            sb.append("      \"date\": \"").append(m.getDate()).append("\",\n");
            sb.append("      \"team\": \"").append(escape(m.getTeam())).append("\",\n");
            sb.append("      \"opponent\": \"").append(escape(m.getOpponent())).append("\",\n");
            sb.append("      \"venue\": \"").append(m.getVenue()).append("\",\n");
            sb.append("      \"goalsFor\": ").append(m.getGoalsFor()).append(",\n");
            sb.append("      \"goalsAgainst\": ").append(m.getGoalsAgainst()).append(",\n");
            sb.append("      \"result\": \"").append(m.getResult()).append("\"\n");
            sb.append("    }").append(++mIndex < matchesMap.size() ? ",\n" : "\n");
        }
        sb.append("  ]\n");

        sb.append("}\n");

        try (BufferedWriter bw = new BufferedWriter(new FileWriter(file, StandardCharsets.UTF_8))) {
            bw.write(sb.toString());
        }
    }

    private static String rankingsListToJson(List<PlayerRanking> list, Map<String, PlayerStats> statsMap) {
        StringBuilder sb = new StringBuilder();
        sb.append("[\n");
        for (int i = 0; i < list.size(); i++) {
            PlayerRanking r = list.get(i);
            PlayerStats s = statsMap.get(r.getPlayerId());
            sb.append("    ").append(rankingToJson(r, s));
            if (i < list.size() - 1) sb.append(",\n");
            else sb.append("\n");
        }
        sb.append("  ]");
        return sb.toString();
    }

    private static String rankingToJson(PlayerRanking r, PlayerStats s) {
        return String.format(Locale.US,
                "{\"rank\": %d, \"playerId\": \"%s\", \"name\": \"%s\", \"position\": \"%s\", \"team\": \"%s\", \"squadNumber\": %d, \"performanceScore\": %.2f, \"recentForm\": %.2f, \"totalInteractions\": %d, \"tieBreakReason\": \"%s\"}",
                r.getRank(),
                r.getPlayerId(),
                escape(r.getName()),
                r.getPosition(),
                escape(r.getAcademyTeam()),
                r.getPlayer().getSquadNumber(),
                r.getPerformanceScore(),
                r.getRecentForm(),
                r.getTotalInteractions(),
                escape(r.getTieBreakReason())
        );
    }

    private static PlayerRanking findRanking(List<PlayerRanking> rankings, String playerId) {
        for (PlayerRanking r : rankings) {
            if (r.getPlayerId().equals(playerId)) return r;
        }
        return null;
    }

    private static int getTotalGraphInteractions(PlayerInteractionGraph graph) {
        int total = 0;
        for (InteractionEdge e : graph.getAllUniqueEdges()) {
            total += e.getWeight();
        }
        return total;
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
