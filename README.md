# Athletix | Sports Academy Analytics Platform

**Developed by Team:** Vertex Eleven  
**System Architecture:** Offline Batch-Processing Analytics Pipeline  
**Dataset:** Synthetic Demo Dataset (Fictional Academy Match Records)

---

## 🏆 Project Goal & Overview

**Athletix** is a high-performance sports academy analytics platform designed to objectively evaluate, rank, and visualize academy player performance using **historical match data**.

Athletix is strictly a **batch-processing system, NOT a real-time application**. It does **NOT** use Spring Boot, Node.js backend APIs, WebSockets, or live sports APIs. All ranking and graph calculations are executed in deterministic batch cycles across decoupled Java and Python engines, and exported directly for static web presentation.

---

## 🔄 Exact Processing Pipeline Flow

The platform implements this exact decoupled pipeline:

```
+-----------------------------------------------------------------------------------+
|                              ATHLETIX BATCH PIPELINE                              |
+-----------------------------------------------------------------------------------+
|  [Raw Historical Match & Passing CSVs]                                           |
|       │                                                                           |
|       ▼                                                                           |
|  [Java OOP & Graph Engine]                                                        |
|       • Models: Player, Match, MatchPerformance, PassInteraction, PlayerStats     |
|       • Weighted Graph: PlayerInteractionGraph (Nodes=Players, Edges=Interactions)|
|       • Computes Total Interactions, Connected Teammates, Weighted Involvement    |
|       ▼                                                                           |
|  [data/processed/player_stats.csv]                                                |
|       │                                                                           |
|       ▼                                                                           |
|  [Python Scikit-Learn AI Regression Engine]                                       |
|       • Ingests player_stats.csv                                                  |
|       • Validates features & guards against data leakage                          |
|       • Evaluates via 5-Fold Cross-Validation (R² ~ 0.987, MAE ~ 0.68)           |
|       • Computes calibrated 0–100 Performance Scores                             |
|       ▼                                                                           |
|  [data/processed/performance_scores.csv]                                          |
|       │                                                                           |
|       ▼                                                                           |
|  [Java PriorityQueue Heap Engine]                                                 |
|       • Reads performance_scores.csv                                              |
|       • Multi-tier tie-breaking:                                                  |
|           1. Higher performance score                                             |
|           2. Higher recent-form score                                             |
|           3. Lower player ID                                                      |
|       • Extracts Top-3, Top-5, Top-10 and full squad rankings                     |
|       • Exports final_rankings.csv and frontend/public/data/                      |
|       ▼                                                                           |
|  [React + Vite Static Dashboard]                                                  |
|       • 100% Static Deployment (Zero backend server dependency)                   |
|       • Displays Java Heap rankings without recalculating client-side             |
+-----------------------------------------------------------------------------------+
```

---

## ⚙️ Technology Stack

| Layer | Technologies | Responsibilities |
| :--- | :--- | :--- |
| **Data Ingestion & OOP** | **Java 25 (Standard Edition)** | OOP domain classes (`Player`, `Match`, `PlayerStats`, `PassInteraction`), CSV parsing, aggregate metrics |
| **Graph Processing** | **Java Custom Weighted Graph** | Weighted adjacency list, interaction volume, teammate connectivity degree, player involvement metric |
| **Ranking Engine** | **Java PriorityQueue Heap** | $O(K \log N)$ Top-K extraction (Top 3, Top 5, Top 10) with deterministic 3-tier tie-breaking |
| **AI Regression** | **Python 3.14 + Scikit-Learn + Pandas + NumPy** | Supervised `Ridge` regression pipeline with `StandardScaler`, K-Fold cross validation, 0–100 score generation |
| **Data Interop** | **CSV Files** | Clean decoupled file exchange (`player_stats.csv` $\leftrightarrow$ `performance_scores.csv`) |
| **Frontend UI** | **React 19 + Vite + TypeScript + Tailwind CSS** | Static modern dashboard, Recharts analytics, interactive tactical SVG passing graph |

---

## ☕ Java Engine Architecture

Located in `java-engine/src/com/vertexeleven/athletix/`:

### 1. Domain Object-Oriented Classes
* **`Player`**: Encapsulates player identity, squad number, tactical position, academy team, and age.
* **`Match`**: Represents historical fixture details (date, venue, opponent, goals for/against, result).
* **`MatchPerformance`**: Detailed match log (minutes, goals, assists, shots, passes completed, pass accuracy, tackles, interceptions, match rating).
* **`PassInteraction`**: Represents an individual passing link event between two players in a match.
* **`PlayerStats`**: Aggregated performance metrics, recent form, consistency, and graph involvement.
* **`PlayerRanking`**: Holds rank, AI performance score, recent form, total interactions, and tie-breaking audit notes.

### 2. Weighted Player Interaction Graph
* **`InteractionEdge`**: Stores interaction pair and cumulative pass weights.
* **`PlayerInteractionGraph`**:
  * **Nodes**: Academy players.
  * **Edges**: Passing interactions between teammates.
  * **Edge Weight**: Total volume of passes exchanged.
  * **Graph Metrics Calculated**:
    * `totalInteractions`: Sum of all passes connected to a player.
    * `connectedTeammates`: Number of distinct teammates passed with.
    * `weightedInvolvement`: Composite metric blending total volume and network breadth.
    * `interactionDensity`: Average passes per connected teammate.

### 3. Heap-Based Top-K Ranking
* **`PlayerRankingComparator`**: Enforces strict 3-tier tie-breaking order:
  1. Higher Performance Score (descending)
  2. Higher Recent-Form Score (descending)
  3. Lower Player ID (alphabetical ascending, e.g., `P001` before `P002`)
* **`TopKHeapRanker`**:
  * Utilizes `java.util.PriorityQueue` to rank candidates in $O(K \log N)$ time.
  * Extracts **Top 3**, **Top 5**, **Top 10**, and full squad rankings.
  * Audits every rank to annotate exact tie-breaking reasons.

---

## 🐍 Python AI / Regression Engine

Located in `python-model/src/`:

* **`train_and_score.py`**:
  * Ingests `data/processed/player_stats.csv`.
  * Features used:
    * `goals_per_match`, `assists_per_match`
    * `pass_accuracy`, `passes_completed`, `shots`
    * `tackles_per_match`, `interceptions_per_match`
    * `total_minutes`, `recent_form`, `consistency_score`
    * Graph metrics: `total_interactions`, `connected_teammates`, `weighted_involvement`, `interaction_density`
  * Model: `Pipeline([('scaler', StandardScaler()), ('regressor', Ridge(alpha=1.5))])`
  * Validation: 5-Fold Cross-Validation ($R^2 = 0.9875$, $\text{MAE} = 0.6801$) to prevent data leakage.
  * Generates **Performance Score: 0–100**.
  * Writes `data/processed/performance_scores.csv` and `data/processed/model_metadata.json`.

> [!NOTE]  
> **Score Meaning:** The score represents historical performance based on available measurable features in academy matches. It does not predict future career success or absolute player ability.

---

## ⚛️ React + Vite Frontend Dashboard

Located in `frontend/`:

The frontend is **100% statically deployable** (built to `dist/`). It does not require a running Spring Boot server or Node API.

### Sections:
1. **Dashboard**:
   * Summary KPIs: Total Players, Matches Analyzed, Average Performance Score, Top Ranked Player.
   * Top-K Heap Table with instant toggles for **Top 3**, **Top 5**, and **Top 10**.
   * Spotlights: Golden Boot, Top Passer, Peak Form.
2. **Rankings**:
   * Complete 24-player ranking table directly from the Java heap.
   * Filter by position and team.
   * Sort by score or form while preserving the official Java rank.
   * Displays tie-break audit trail.
3. **Players**:
   * Interactive roster grid with real-time search and position/team filtering.
   * Quick-view cards with stats badges and squad numbers.
4. **Player Profile**:
   * Detailed bio, rank badge, score, goals, assists, accuracy, form, consistency, interaction volume.
   * Recharts Area chart showing match-by-match rating progression over history.
   * Teammate passing synergy cards.
5. **Interaction Network**:
   * Interactive tactical SVG graph displaying the Java-generated network.
   * Nodes colored by tactical position and sized by weighted involvement.
   * Edge thickness corresponds to pass volume.
   * Click any player to highlight their direct teammate connections and exact pass counts.
   * Filter by team squad and minimum pass threshold.
6. **Analytics**:
   * Squad performance trend across matches.
   * Goals vs. assists distribution for top contributors.
   * Pass accuracy distribution by tactical position.
   * Interaction volume vs. Performance Score correlation.
   * Performance-score histogram.
7. **Data Management**:
   * Browse raw historical match records.
   * Ingest new match records with real-time schema and score validation.
   * Run client-side batch recalculations reflecting the exact Java/Python pipeline formula.
   * Export updated datasets as JSON.

---

## 🚀 How to Run the Project

### Prerequisites
* Java JDK 17+ or 25+ (`javac`, `java`)
* Python 3.10+ with `pandas`, `numpy`, `scikit-learn`
* Node.js 18+ and `npm`

---

### Option 1: One-Click Full Pipeline (Recommended)

Run the automated batch pipeline runner from the root directory:

**On Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File pipeline/run_pipeline.ps1
```

**On Windows (Command Prompt):**
```cmd
pipeline\run_pipeline.bat
```

This script automatically:
1. Compiles the Java OOP classes into `java-engine/bin`.
2. Runs Java Phase 1 (Data Ingest $\to$ Graph Construction $\to$ `player_stats.csv`).
3. Runs Python AI Regression (`train_and_score.py` $\to$ `performance_scores.csv`).
4. Runs Java Phase 2 (Heap Top-K $\to$ `final_rankings.csv` $\to$ `frontend/public/data/athletix_master_data.json`).

---

### Option 2: Run Steps Individually

#### Step 1: Java Phase 1
```bash
# Compile
javac -d java-engine/bin java-engine/src/com/vertexeleven/athletix/model/*.java java-engine/src/com/vertexeleven/athletix/graph/*.java java-engine/src/com/vertexeleven/athletix/ranking/*.java java-engine/src/com/vertexeleven/athletix/io/*.java java-engine/src/com/vertexeleven/athletix/*.java

# Run Phase 1
java -cp java-engine/bin com.vertexeleven.athletix.AthletixEngine --phase=1
```

#### Step 2: Python AI Regression
```bash
python python-model/src/train_and_score.py
```

#### Step 3: Java Phase 2 (PriorityQueue Heap Top-K)
```bash
java -cp java-engine/bin com.vertexeleven.athletix.AthletixEngine --phase=2
```

#### Step 4: Run Java Unit Tests
```bash
javac -cp java-engine/bin -d java-engine/bin java-engine/src/com/vertexeleven/athletix/test/TopKHeapRankerTest.java
java -ea -cp java-engine/bin com.vertexeleven.athletix.test.TopKHeapRankerTest
```

---

### Option 3: Launch the React Frontend

```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:3000`.

To create a static production build:
```bash
npm run build
```
The static build is output to `frontend/dist/` and can be hosted directly on any static web host (GitHub Pages, Vercel, Netlify, S3) with zero backend servers required.

---

## 📊 Dataset Attribution

All data bundled in this repository is a **Synthetic Demo Dataset** designed for youth sports academy demonstration purposes:
* 24 fictional players across 2 academy squads (Vertex Alpha & Vertex Beta).
* 15 historical academy fixtures.
* 183 individual match performance logs.
* 896 direct teammate passing events.
* No famous real-world player names or proprietary match feeds are used.
