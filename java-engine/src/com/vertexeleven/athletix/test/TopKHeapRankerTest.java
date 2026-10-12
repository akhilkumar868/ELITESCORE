package com.vertexeleven.athletix.test;

import com.vertexeleven.athletix.model.Player;
import com.vertexeleven.athletix.model.PlayerRanking;
import com.vertexeleven.athletix.ranking.PlayerRankingComparator;
import com.vertexeleven.athletix.ranking.TopKHeapRanker;
import java.util.*;

/**
 * Unit verification tests for Java PriorityQueue Heap and multi-tier tie-breaking.
 */
public class TopKHeapRankerTest {

    public static void main(String[] args) {
        System.out.println("Running TopKHeapRanker and Comparator Verification Tests...");

        // Test 1: Tie-breaking on Recent Form when Scores are identical
        Player pA = new Player("P050", "Player Alpha", "Midfielder", 8, "Academy A", 18);
        Player pB = new Player("P051", "Player Beta", "Midfielder", 10, "Academy B", 18);

        // Same score 88.50, but Player Beta has higher recent form (92.0 vs 85.0)
        PlayerRanking rA = new PlayerRanking(pA, 88.50, 85.00, 400);
        PlayerRanking rB = new PlayerRanking(pB, 88.50, 92.00, 410);

        PlayerRankingComparator comp = new PlayerRankingComparator();
        int cmpResult1 = comp.compare(rA, rB);
        // rB should rank ahead of rA (i.e. comp.compare(rB, rA) < 0)
        assert cmpResult1 > 0 : "Player Beta with higher recent form must rank higher than Player Alpha";
        System.out.println(" [PASS] Test 1: Identical score broken by higher recent-form score");

        // Test 2: Tie-breaking on Player ID when Score and Recent Form are both identical
        Player pC = new Player("P002", "Player Gamma", "Forward", 9, "Academy A", 19);
        Player pD = new Player("P010", "Player Delta", "Forward", 11, "Academy A", 19);
        PlayerRanking rC = new PlayerRanking(pC, 90.00, 95.00, 500);
        PlayerRanking rD = new PlayerRanking(pD, 90.00, 95.00, 500);

        int cmpResult2 = comp.compare(rC, rD);
        // P002 is lower than P010, so rC should come before rD (compare returns < 0)
        assert cmpResult2 < 0 : "Lower player ID (P002) must win tie-break over higher ID (P010)";
        System.out.println(" [PASS] Test 2: Identical score and form broken by lower player ID");

        // Test 3: PriorityQueue Top-K Heap extraction
        TopKHeapRanker ranker = new TopKHeapRanker();
        List<PlayerRanking> candidates = Arrays.asList(rA, rB, rC, rD);

        List<PlayerRanking> top3 = ranker.getTopK(candidates, 3);
        assert top3.size() == 3 : "Top 3 must return exactly 3 elements";
        assert top3.get(0).getPlayerId().equals("P002") : "Rank #1 should be P002 (Score 90.0)";
        assert top3.get(1).getPlayerId().equals("P010") : "Rank #2 should be P010 (Score 90.0)";
        assert top3.get(2).getPlayerId().equals("P051") : "Rank #3 should be P051 (Score 88.5, Form 92.0)";
        System.out.println(" [PASS] Test 3: PriorityQueue correctly ranked Top 3 with exact tie-breaking");

        System.out.println("ALL JAVA RANKING & HEAP UNIT TESTS PASSED SUCCESSFULLY!\n");
    }
}
