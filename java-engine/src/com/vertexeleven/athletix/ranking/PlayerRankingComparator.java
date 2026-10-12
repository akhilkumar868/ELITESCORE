package com.vertexeleven.athletix.ranking;

import com.vertexeleven.athletix.model.PlayerRanking;
import java.util.Comparator;

/**
 * Deterministic Comparator for Athletix Player Rankings.
 * 
 * Strict Tie-Breaking Order:
 * 1. Higher performance score (descending)
 * 2. Higher recent-form score (descending)
 * 3. Lower player ID (ascending, e.g. P001 < P002)
 */
public class PlayerRankingComparator implements Comparator<PlayerRanking> {
    private static final double EPSILON = 1e-4;

    @Override
    public int compare(PlayerRanking p1, PlayerRanking p2) {
        // 1. Higher performance score first
        if (Math.abs(p1.getPerformanceScore() - p2.getPerformanceScore()) > EPSILON) {
            return Double.compare(p2.getPerformanceScore(), p1.getPerformanceScore());
        }

        // 2. Higher recent-form score
        if (Math.abs(p1.getRecentForm() - p2.getRecentForm()) > EPSILON) {
            return Double.compare(p2.getRecentForm(), p1.getRecentForm());
        }

        // 3. Lower player ID (alphabetical natural order e.g. P001 before P002)
        return p1.getPlayerId().compareTo(p2.getPlayerId());
    }
}
