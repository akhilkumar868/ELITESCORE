# Walkthrough - Athletix (Team Vertex Eleven)

**Athletix** has been built from scratch as an offline **batch-processing sports academy analytics platform**.

---

## 🎯 Verification & Accomplishments

### 1. Data Processing Pipeline Flow
The exact required pipeline flow is implemented and verified:
$$\text{Historical Match Data} \longrightarrow \text{Java Engine} \longrightarrow \text{player\_stats.csv} \longrightarrow \text{Python Regression} \longrightarrow \text{performance\_scores.csv} \longrightarrow \text{Java PriorityQueue Heap} \longrightarrow \text{Final Rankings} \longrightarrow \text{React Dashboard}$$

* **Java OOP Domain Architecture**:
  * [Player.java](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/java-engine/src/com/vertexeleven/athletix/model/Player.java)
  * [Match.java](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/java-engine/src/com/vertexeleven/athletix/model/Match.java)
  * [MatchPerformance.java](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/java-engine/src/com/vertexeleven/athletix/model/MatchPerformance.java)
  * [PassInteraction.java](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/java-engine/src/com/vertexeleven/athletix/model/PassInteraction.java)
  * [PlayerStats.java](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/java-engine/src/com/vertexeleven/athletix/model/PlayerStats.java)
  * [PlayerRanking.java](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/java-engine/src/com/vertexeleven/athletix/model/PlayerRanking.java)

* **Weighted Interaction Graph**:
  * [PlayerInteractionGraph.java](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/java-engine/src/com/vertexeleven/athletix/graph/PlayerInteractionGraph.java):
    * Computes total interactions, number of connected teammates, weighted degree/involvement, and interaction density.
    * Uses actual match passing events (896 interactions).

* **Deterministic Heap-Based Top-K Ranking**:
  * [TopKHeapRanker.java](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/java-engine/src/com/vertexeleven/athletix/ranking/TopKHeapRanker.java) & [PlayerRankingComparator.java](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/java-engine/src/com/vertexeleven/athletix/ranking/PlayerRankingComparator.java)
  * Implements exact multi-tier tie-breaking:
    1. Higher Performance Score (descending)
    2. Higher Recent-Form Score (descending)
    3. Lower Player ID (ascending)
  * Verified by automated unit tests in [TopKHeapRankerTest.java](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/java-engine/src/com/vertexeleven/athletix/test/TopKHeapRankerTest.java).

* **Python AI / Regression Engine**:
  * [train_and_score.py](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/python-model/src/train_and_score.py):
    * Validates features without data leakage.
    * Evaluates with 5-Fold Cross-Validation: $R^2 = 0.9875$, $\text{MAE} = 0.6801$.
    * Generates calibrated 0–100 Performance Scores.
    * Writes [performance_scores.csv](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/data/processed/performance_scores.csv) and [model_metadata.json](file:///c:/Users/akhil/OneDrive/Documents/rank%20anlaytics/data/processed/model_metadata.json).

* **Synthetic Demo Dataset**:
  * 24 fictional players across 2 academy teams (Vertex Alpha & Vertex Beta).
  * 15 historical academy matches.
  * 183 individual performance logs.
  * 896 pass interaction records.
  * Clearly labeled as **Synthetic Demo Dataset**.

---

## 💻 React Dashboard Sections

The frontend is built with React 19 + TypeScript + Tailwind CSS and compiles to a 100% static production build (`frontend/dist/`), requiring zero backend servers (no Spring Boot or Node APIs).

1. **Dashboard**:
   * Summary KPIs: Total Players (24), Matches Analyzed (15), Average Score (81.88), Top Player (Felix Richter, Defender, 94.55).
   * Java PriorityQueue Heap Top-K table with instant toggles for **Top 3**, **Top 5**, and **Top 10**.
   * Spotlights: Academy Golden Boot, Top Passer, Peak Recent Form.
2. **Rankings**:
   * Complete 24-player ranking table directly reflecting Java heap output.
   * Search by player name/ID, position filtering, team filtering.
   * Audit trail for tie-breaking.
3. **Players**:
   * Roster grid with search and position/team filters.
   * Cards with squad numbers, performance scores, and key stats.
4. **Player Profile**:
   * Modal displaying name, squad number, team, rank, score, form, consistency, passing metrics, defensive actions.
   * Recharts area chart showing match-by-match rating evolution.
   * Top connected teammates with passing volume.
5. **Interaction Network**:
   * Tactical pitch SVG interactive graph visualization.
   * Node positions organized by tactical zones (Attack, Midfield, Defense, Goalkeeper).
   * Nodes colored by tactical position and sized by weighted involvement.
   * Edge thickness represents pass volume.
   * Click any player to isolate and reveal connected teammate links with pass counts.
   * Filter by squad and adjust minimum pass threshold.
6. **Analytics**:
   * Squad performance trend across matches.
   * Top offensive contributors (Goals vs Assists).
   * Pass accuracy by tactical position.
   * Interaction volume vs Performance Score correlation scatter chart.
   * Performance score distribution histogram.
7. **Data Management**:
   * Historical fixture viewer.
   * Ingest new match records with real-time schema and score validation warnings.
   * In-browser simulated batch recalculator that applies the exact Java/Python pipeline formula.
   * Export updated datasets as JSON.

---

## 🧪 Verification Results

### Automated Pipeline Execution
```
$ powershell -ExecutionPolicy Bypass -File pipeline/run_pipeline.ps1

[STEP 1/4] Compiling Java Engine...
Java compilation successful.

[STEP 2/4] Running Java Phase 1 (Data Ingest, OOP Stats & Interaction Graph)...
Loaded: 24 Players, 15 Matches, 183 Match Performances, 896 Passing Events
Successfully exported player statistics and graph metrics to data/processed/player_stats.csv

[STEP 3/4] Running Python AI Regression (Scikit-Learn Modeling)...
Loaded 24 player records from data/processed/player_stats.csv
5-Fold Cross Validation R²:  0.9875 (+/- 0.0097)
5-Fold Cross Validation MAE: 0.6801 (+/- 0.3236)
Successfully wrote 24 scores to data/processed/performance_scores.csv

[STEP 4/4] Running Java Phase 2 (PriorityQueue Heap Top-K & Export)...
Rank  | Player             | Position     | Score   | Form   | Interactions | Tie-Break Status
#1    | Felix Richter      | Defender     | 94.55   | 99.20  | 844          | Tournament Leader
#2    | Julian Sterling    | Midfielder   | 93.96   | 100.00 | 951          | Direct Score Advantage
#3    | Caleb Ward         | Defender     | 93.92   | 99.40  | 819          | Direct Score Advantage
#4    | Victor Hayes       | Defender     | 92.98   | 98.60  | 844          | Direct Score Advantage
#5    | Arjun Rao          | Midfielder   | 91.33   | 100.00 | 980          | Direct Score Advantage

Exported final rankings to data/processed/final_rankings.csv
Exported static master dataset to frontend at frontend/public/data/athletix_master_data.json
ATHLETIX BATCH PIPELINE COMPLETED SUCCESSFULLY!
```

### Java Unit Tests Execution
```
$ java -ea -cp java-engine/bin com.vertexeleven.athletix.test.TopKHeapRankerTest

Running TopKHeapRanker and Comparator Verification Tests...
 [PASS] Test 1: Identical score broken by higher recent-form score
 [PASS] Test 2: Identical score and form broken by lower player ID
 [PASS] Test 3: PriorityQueue correctly ranked Top 3 with exact tie-breaking
ALL JAVA RANKING & HEAP UNIT TESTS PASSED SUCCESSFULLY!
```

### Static React Build Verification
```
$ cd frontend && npm run build

vite v6.4.3 building for production...
✓ 2525 modules transformed.
dist/index.html                   1.15 kB
dist/assets/index-BcEoqspX.css   28.12 kB
dist/assets/index-OCy_0wUd.js   811.93 kB
✓ built in 8.48s
```
Zero build warnings, zero runtime dependencies on local servers or APIs.
