package com.vertexeleven.athletix.ranking;

import com.vertexeleven.athletix.model.PlayerRanking;
import java.util.*;

/**
 * Heap-based Top-K Ranker using Java's PriorityQueue.
 * Developed by Team Vertex Eleven.
 * 
 * Supports:
 * - Top 3
 * - Top 5
 * - Top 10
 * - Complete squad ranking
 */
public class TopKHeapRanker {
    private final PlayerRankingComparator comparator = new PlayerRankingComparator();
    private static final double EPSILON = 1e-4;

    /**
     * Extracts Top-K player rankings using a PriorityQueue heap.
     * 
     * @param candidates All player rankings
     * @param k Maximum number of top players to extract (e.g. 3, 5, 10)
     * @return List of Top-K PlayerRanking objects in descending rank order (1..k)
     */
    public List<PlayerRanking> getTopK(Collection<PlayerRanking> candidates, int k) {
        if (candidates == null || candidates.isEmpty()) {
            return Collections.emptyList();
        }

        // Initialize PriorityQueue with the multi-tier tie-breaking comparator (Max-Heap)
        PriorityQueue<PlayerRanking> maxHeap = new PriorityQueue<>(comparator);
        maxHeap.addAll(candidates);

        int limit = Math.min(k, maxHeap.size());
        List<PlayerRanking> topK = new ArrayList<>(limit);

        PlayerRanking previous = null;
        for (int rankIndex = 1; rankIndex <= limit; rankIndex++) {
            PlayerRanking current = maxHeap.poll();
            if (current == null) break;

            current.setRank(rankIndex);

            // Audit tie-breaking
            if (previous != null) {
                if (Math.abs(current.getPerformanceScore() - previous.getPerformanceScore()) < EPSILON) {
                    if (Math.abs(current.getRecentForm() - previous.getRecentForm()) < EPSILON) {
                        current.setTieBreakReason(String.format("Tied with #%d (%s) on Score & Form; Broken by Lower Player ID (%s vs %s)",
                                previous.getRank(), previous.getName(), previous.getPlayerId(), current.getPlayerId()));
                    } else {
                        current.setTieBreakReason(String.format("Tied with #%d (%s) on Score (%.1f); Broken by Higher Recent Form (%.1f vs %.1f)",
                                previous.getRank(), previous.getName(), current.getPerformanceScore(), previous.getRecentForm(), current.getRecentForm()));
                    }
                } else {
                    current.setTieBreakReason("Direct Score Advantage");
                }
            } else {
                current.setTieBreakReason("Tournament Leader");
            }

            topK.add(current);
            previous = current;
        }

        return topK;
    }

    /**
     * Ranks the entire squad using the heap.
     */
    public List<PlayerRanking> rankAll(Collection<PlayerRanking> candidates) {
        return getTopK(candidates, candidates.size());
    }
}
