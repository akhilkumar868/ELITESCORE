package com.vertexeleven.athletix;

import com.vertexeleven.athletix.graph.PlayerInteractionGraph;
import com.vertexeleven.athletix.io.CsvDataHandler;
import com.vertexeleven.athletix.io.JsonDataExporter;
import com.vertexeleven.athletix.model.*;
import com.vertexeleven.athletix.ranking.TopKHeapRanker;

import java.io.File;
import java.util.*;

/**
 * Athletix Core Engine
 * Developed by Team Vertex Eleven.
 * 
 * Pipeline Orchestration:
 * Phase 1: Ingest raw data -> Compute OOP Stats & Weighted Interaction Graph -> Export player_stats.csv
 * Phase 2: Ingest performance_scores.csv -> PriorityQueue Heap Top-K Ranking -> Export Final Rankings & Master JSON
 */
public class AthletixEngine {
    private static final String RAW_PLAYERS = "data/raw/players.csv";
    private static final String RAW_MATCHES = "data/raw/matches.csv";
    private static final String RAW_PERFORMANCES = "data/raw/match_performances.csv";
    private static final String RAW_INTERACTIONS = "data/raw/pass_interactions.csv";

    private static final String PROCESSED_STATS = "data/processed/player_stats.csv";
    private static final String PROCESSED_SCORES = "data/processed/performance_scores.csv";
    private static final String FINAL_RANKINGS_CSV = "data/processed/final_rankings.csv";
    private static final String MASTER_JSON_OUT = "data/processed/athletix_master_data.json";
    private static final String FRONTEND_PUBLIC_JSON = "frontend/public/data/athletix_master_data.json";
    private static final String FRONTEND_SRC_JSON = "frontend/src/data/athletix_master_data.json";

    public static void main(String[] args) {
        String phase = "all";
        for (String arg : args) {
            if (arg.startsWith("--phase=")) {
                phase = arg.substring("--phase=".length()).trim().toLowerCase();
            }
        }

        System.out.println("==================================================================");
        System.out.println("            ATHLETIX ENGINE - TEAM VERTEX ELEVEN                 ");
        System.out.println(" Batch-Engineered Sports Academy Performance & Interaction System");
        System.out.println("==================================================================");

        try {
            if ("1".equals(phase) || "all".equals(phase) || "phase1".equals(phase)) {
                runPhase1();
            }

            if ("2".equals(phase) || "phase2".equals(phase)) {
                runPhase2();
            } else if ("all".equals(phase)) {
                File scoresFile = new File(PROCESSED_SCORES);
                if (scoresFile.exists()) {
                    runPhase2();
                } else {
                    System.out.println("\n[NOTICE] Phase 1 completed successfully.");
                    System.out.println("Next step: Run Python regression model ('python python-model/src/train_and_score.py')");
                    System.out.println("to generate " + PROCESSED_SCORES + ", then run Java with --phase=2.");
                }
            }

        } catch (Exception e) {
            System.err.println("\n[ERROR] Engine execution halted: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    /**
     * Phase 1: Ingest Raw Historical Data, Compute Player Stats, Build Weighted Graph, Export player_stats.csv
     */
    public static void runPhase1() throws Exception {
        System.out.println("\n>>> [PHASE 1] Ingesting Historical Data & Building Interaction Graph...");

        Map<String, Player> players = CsvDataHandler.readPlayers(RAW_PLAYERS);
        Map<String, Match> matches = CsvDataHandler.readMatches(RAW_MATCHES);
        List<MatchPerformance> performances = CsvDataHandler.readPerformances(RAW_PERFORMANCES);
        List<PassInteraction> interactions = CsvDataHandler.readPassInteractions(RAW_INTERACTIONS);

        System.out.printf("Loaded: %d Players, %d Matches, %d Match Performances, %d Passing Events%n",
                players.size(), matches.size(), performances.size(), interactions.size());

        // 1. Group performances by player
        Map<String, List<MatchPerformance>> perPlayerMap = new HashMap<>();
        for (MatchPerformance mp : performances) {
            perPlayerMap.computeIfAbsent(mp.getPlayerId(), k -> new ArrayList<>()).add(mp);
        }

        // 2. Build Weighted Interaction Graph
        PlayerInteractionGraph graph = new PlayerInteractionGraph();
        for (Player p : players.values()) {
            graph.addPlayerNode(p.getPlayerId());
        }
        for (PassInteraction pi : interactions) {
            graph.recordInteraction(pi);
        }

        // 3. Compute Aggregate Stats + Graph Metrics
        Map<String, PlayerStats> statsMap = new LinkedHashMap<>();
        for (Player p : players.values()) {
            String pid = p.getPlayerId();
            PlayerStats stats = new PlayerStats(pid);
            List<MatchPerformance> pLogs = perPlayerMap.getOrDefault(pid, Collections.emptyList());

            int count = pLogs.size();
            stats.setMatchesPlayed(count);

            int totalMin = 0, goals = 0, assists = 0, shots = 0;
            int passesAtt = 0, passesComp = 0, tackles = 0, inter = 0, clean = 0;
            double ratingSum = 0;
            List<Double> ratings = new ArrayList<>();

            for (MatchPerformance mp : pLogs) {
                totalMin += mp.getMinutesPlayed();
                goals += mp.getGoals();
                assists += mp.getAssists();
                shots += mp.getShots();
                passesAtt += mp.getPassesAttempted();
                passesComp += mp.getPassesCompleted();
                tackles += mp.getTackles();
                inter += mp.getInterceptions();
                clean += mp.getCleanSheet();
                ratingSum += mp.getMatchRating();
                ratings.add(mp.getMatchRating());
            }

            stats.setTotalMinutes(totalMin);
            stats.setTotalGoals(goals);
            stats.setTotalAssists(assists);
            stats.setTotalShots(shots);
            stats.setTotalPassesAttempted(passesAtt);
            stats.setTotalPassesCompleted(passesComp);
            stats.setOverallPassAccuracy(passesAtt > 0 ? (double) passesComp / passesAtt * 100.0 : 0.0);
            stats.setTotalTackles(tackles);
            stats.setTotalInterceptions(inter);
            stats.setTotalCleanSheets(clean);
            stats.setAverageMatchRating(count > 0 ? ratingSum / count : 0.0);

            // Recent Form: Weighted average of up to last 4 matches
            double recentForm = calculateRecentForm(ratings);
            stats.setRecentFormScore(recentForm);

            // Consistency Score: 100 - (StdDev * 20), bounded 10 - 98
            double consistency = calculateConsistency(ratings);
            stats.setConsistencyScore(consistency);

            // Graph Metrics
            stats.setTotalInteractions(graph.getTotalInteractions(pid));
            stats.setConnectedTeammates(graph.getConnectedTeammatesCount(pid));
            stats.setWeightedInvolvement(graph.getWeightedInvolvement(pid));
            stats.setInteractionDensity(graph.getInteractionDensity(pid));

            statsMap.put(pid, stats);
        }

        // 4. Export player_stats.csv
        CsvDataHandler.writePlayerStats(PROCESSED_STATS, statsMap);
        System.out.printf("Successfully exported player statistics and graph metrics to %s%n", PROCESSED_STATS);
    }

    /**
     * Phase 2: Read Python Performance Scores -> PriorityQueue Heap Top-K -> Export Final Rankings & Master JSON
     */
    public static void runPhase2() throws Exception {
        System.out.println("\n>>> [PHASE 2] Loading AI Scores & Executing PriorityQueue Heap Top-K...");

        Map<String, Player> players = CsvDataHandler.readPlayers(RAW_PLAYERS);
        Map<String, Match> matches = CsvDataHandler.readMatches(RAW_MATCHES);
        List<MatchPerformance> performances = CsvDataHandler.readPerformances(RAW_PERFORMANCES);
        List<PassInteraction> interactions = CsvDataHandler.readPassInteractions(RAW_INTERACTIONS);

        // Reconstruct graph for JSON export
        PlayerInteractionGraph graph = new PlayerInteractionGraph();
        for (Player p : players.values()) graph.addPlayerNode(p.getPlayerId());
        for (PassInteraction pi : interactions) graph.recordInteraction(pi);

        // Recompute stats map
        Map<String, List<MatchPerformance>> perPlayerMap = new HashMap<>();
        for (MatchPerformance mp : performances) {
            perPlayerMap.computeIfAbsent(mp.getPlayerId(), k -> new ArrayList<>()).add(mp);
        }
        Map<String, PlayerStats> statsMap = new LinkedHashMap<>();
        for (Player p : players.values()) {
            String pid = p.getPlayerId();
            PlayerStats stats = new PlayerStats(pid);
            List<MatchPerformance> pLogs = perPlayerMap.getOrDefault(pid, Collections.emptyList());

            int count = pLogs.size();
            stats.setMatchesPlayed(count);
            int totalMin = 0, goals = 0, assists = 0, shots = 0, passesAtt = 0, passesComp = 0, tackles = 0, inter = 0, clean = 0;
            double ratingSum = 0;
            List<Double> ratings = new ArrayList<>();
            for (MatchPerformance mp : pLogs) {
                totalMin += mp.getMinutesPlayed();
                goals += mp.getGoals();
                assists += mp.getAssists();
                shots += mp.getShots();
                passesAtt += mp.getPassesAttempted();
                passesComp += mp.getPassesCompleted();
                tackles += mp.getTackles();
                inter += mp.getInterceptions();
                clean += mp.getCleanSheet();
                ratingSum += mp.getMatchRating();
                ratings.add(mp.getMatchRating());
            }
            stats.setTotalMinutes(totalMin);
            stats.setTotalGoals(goals);
            stats.setTotalAssists(assists);
            stats.setTotalShots(shots);
            stats.setTotalPassesAttempted(passesAtt);
            stats.setTotalPassesCompleted(passesComp);
            stats.setOverallPassAccuracy(passesAtt > 0 ? (double) passesComp / passesAtt * 100.0 : 0.0);
            stats.setTotalTackles(tackles);
            stats.setTotalInterceptions(inter);
            stats.setTotalCleanSheets(clean);
            stats.setAverageMatchRating(count > 0 ? ratingSum / count : 0.0);
            stats.setRecentFormScore(calculateRecentForm(ratings));
            stats.setConsistencyScore(calculateConsistency(ratings));
            stats.setTotalInteractions(graph.getTotalInteractions(pid));
            stats.setConnectedTeammates(graph.getConnectedTeammatesCount(pid));
            stats.setWeightedInvolvement(graph.getWeightedInvolvement(pid));
            stats.setInteractionDensity(graph.getInteractionDensity(pid));
            statsMap.put(pid, stats);
        }

        // Read AI Performance Scores from Python regression
        Map<String, Double> scores = CsvDataHandler.readPerformanceScores(PROCESSED_SCORES);
        System.out.printf("Loaded %d AI Performance Scores from %s%n", scores.size(), PROCESSED_SCORES);

        List<PlayerRanking> candidates = new ArrayList<>();
        for (Player p : players.values()) {
            double score = scores.getOrDefault(p.getPlayerId(), 50.0);
            PlayerStats stats = statsMap.get(p.getPlayerId());
            double form = stats != null ? stats.getRecentFormScore() : 50.0;
            int interactionsCount = stats != null ? stats.getTotalInteractions() : 0;
            candidates.add(new PlayerRanking(p, score, form, interactionsCount));
        }

        // Execute Heap Top-K
        TopKHeapRanker ranker = new TopKHeapRanker();
        List<PlayerRanking> allRanked = ranker.rankAll(candidates);
        List<PlayerRanking> top3 = ranker.getTopK(candidates, 3);
        List<PlayerRanking> top5 = ranker.getTopK(candidates, 5);
        List<PlayerRanking> top10 = ranker.getTopK(candidates, 10);

        System.out.println("\n------------------------------------------------------------------");
        System.out.println("            FINAL TOP-K RANKINGS (JAVA PRIORITYQUEUE HEAP)        ");
        System.out.println("------------------------------------------------------------------");
        System.out.printf("%-5s | %-18s | %-12s | %-7s | %-6s | %-12s | %s%n",
                "Rank", "Player", "Position", "Score", "Form", "Interactions", "Tie-Break Status");
        System.out.println("------------------------------------------------------------------------------------------------------");
        for (PlayerRanking r : top10) {
            System.out.printf("#%-4d | %-18s | %-12s | %-7.2f | %-6.2f | %-12d | %s%n",
                    r.getRank(), r.getName(), r.getPosition(), r.getPerformanceScore(),
                    r.getRecentForm(), r.getTotalInteractions(), r.getTieBreakReason());
        }

        // Export processed rankings CSV
        CsvDataHandler.writeFinalRankings(FINAL_RANKINGS_CSV, allRanked);
        System.out.printf("%nExported final rankings to %s%n", FINAL_RANKINGS_CSV);

        // Export Master JSON for static frontend
        JsonDataExporter.exportMasterData(MASTER_JSON_OUT, players, statsMap, allRanked, top3, top5, top10, graph, performances, matches);
        JsonDataExporter.exportMasterData(FRONTEND_PUBLIC_JSON, players, statsMap, allRanked, top3, top5, top10, graph, performances, matches);
        JsonDataExporter.exportMasterData(FRONTEND_SRC_JSON, players, statsMap, allRanked, top3, top5, top10, graph, performances, matches);

        System.out.printf("Exported static master dataset to frontend at %s%n", FRONTEND_PUBLIC_JSON);
        System.out.println(">>> Pipeline execution complete!\n");
    }

    private static double calculateRecentForm(List<Double> ratings) {
        if (ratings == null || ratings.isEmpty()) return 50.0;
        int n = ratings.size();
        int sample = Math.min(4, n);
        double weightedSum = 0;
        double weightTotal = 0;
        for (int i = 0; i < sample; i++) {
            double rating = ratings.get(n - 1 - i); // Most recent first
            double weight = Math.pow(1.2, sample - 1 - i);
            weightedSum += rating * weight;
            weightTotal += weight;
        }
        double avg10 = weightTotal > 0 ? weightedSum / weightTotal : 5.0;
        // Scale 1-10 rating to 0-100 scale
        return Math.round((avg10 * 10.0) * 10.0) / 10.0;
    }

    private static double calculateConsistency(List<Double> ratings) {
        if (ratings == null || ratings.size() < 2) return 80.0;
        double sum = 0;
        for (double r : ratings) sum += r;
        double mean = sum / ratings.size();
        double varianceSum = 0;
        for (double r : ratings) varianceSum += Math.pow(r - mean, 2);
        double stdDev = Math.sqrt(varianceSum / ratings.size());
        // Higher consistency for lower standard deviation
        double score = 100.0 - (stdDev * 18.0);
        return Math.max(20.0, Math.min(99.0, Math.round(score * 10.0) / 10.0));
    }
}
