"""
Athletix - Synthetic Demo Dataset Generator
Team: Vertex Eleven
Generates realistic academy match records, player performances, and passing interactions.
Clearly labeled: Synthetic Demo Dataset
"""

import csv
import os
import random
import numpy as np

def generate():
    random.seed(42)
    np.random.seed(42)

    os.makedirs('data/raw', exist_ok=True)
    os.makedirs('data/processed', exist_ok=True)

    # Players definitions (24 fictional academy players)
    players = [
        # Vertex Alpha (12 players)
        {"player_id": "P001", "name": "Leo Vance", "position": "Forward", "squad_number": 9, "academy_team": "Vertex Alpha", "age": 18, "skill_rating": 88},
        {"player_id": "P002", "name": "Mateo Silva", "position": "Forward", "squad_number": 11, "academy_team": "Vertex Alpha", "age": 19, "skill_rating": 82},
        {"player_id": "P005", "name": "Darius Cole", "position": "Midfielder", "squad_number": 8, "academy_team": "Vertex Alpha", "age": 18, "skill_rating": 91},
        {"player_id": "P006", "name": "Ethan Mercer", "position": "Midfielder", "squad_number": 6, "academy_team": "Vertex Alpha", "age": 19, "skill_rating": 85},
        {"player_id": "P007", "name": "Arjun Rao", "position": "Midfielder", "squad_number": 14, "academy_team": "Vertex Alpha", "age": 17, "skill_rating": 79},
        {"player_id": "P008", "name": "Nico Alvarez", "position": "Midfielder", "squad_number": 16, "academy_team": "Vertex Alpha", "age": 18, "skill_rating": 76},
        {"player_id": "P013", "name": "Caleb Ward", "position": "Defender", "squad_number": 4, "academy_team": "Vertex Alpha", "age": 19, "skill_rating": 84},
        {"player_id": "P014", "name": "Tomas Lindqvist", "position": "Defender", "squad_number": 5, "academy_team": "Vertex Alpha", "age": 18, "skill_rating": 83},
        {"player_id": "P015", "name": "Zackary O'Connor", "position": "Defender", "squad_number": 2, "academy_team": "Vertex Alpha", "age": 17, "skill_rating": 78},
        {"player_id": "P016", "name": "Dominik Keller", "position": "Defender", "squad_number": 3, "academy_team": "Vertex Alpha", "age": 18, "skill_rating": 80},
        {"player_id": "P021", "name": "Milan Novak", "position": "Goalkeeper", "squad_number": 1, "academy_team": "Vertex Alpha", "age": 19, "skill_rating": 86},
        {"player_id": "P022", "name": "Jonas Becker", "position": "Goalkeeper", "squad_number": 13, "academy_team": "Vertex Alpha", "age": 17, "skill_rating": 72},

        # Vertex Beta (12 players)
        {"player_id": "P003", "name": "Kai Brennan", "position": "Forward", "squad_number": 7, "academy_team": "Vertex Beta", "age": 17, "skill_rating": 87},
        {"player_id": "P004", "name": "Tariq Thorne", "position": "Forward", "squad_number": 10, "academy_team": "Vertex Beta", "age": 19, "skill_rating": 80},
        {"player_id": "P009", "name": "Julian Sterling", "position": "Midfielder", "squad_number": 8, "academy_team": "Vertex Beta", "age": 19, "skill_rating": 89},
        {"player_id": "P010", "name": "Sami Benali", "position": "Midfielder", "squad_number": 6, "academy_team": "Vertex Beta", "age": 18, "skill_rating": 84},
        {"player_id": "P011", "name": "Marcus Flynn", "position": "Midfielder", "squad_number": 15, "academy_team": "Vertex Beta", "age": 17, "skill_rating": 77},
        {"player_id": "P012", "name": "Rohan Patel", "position": "Midfielder", "squad_number": 20, "academy_team": "Vertex Beta", "age": 18, "skill_rating": 75},
        {"player_id": "P017", "name": "Victor Hayes", "position": "Defender", "squad_number": 4, "academy_team": "Vertex Beta", "age": 19, "skill_rating": 85},
        {"player_id": "P018", "name": "Lucas Navarro", "position": "Defender", "squad_number": 5, "academy_team": "Vertex Beta", "age": 18, "skill_rating": 81},
        {"player_id": "P019", "name": "Adrian Dubois", "position": "Defender", "squad_number": 2, "academy_team": "Vertex Beta", "age": 18, "skill_rating": 79},
        {"player_id": "P020", "name": "Felix Richter", "position": "Defender", "squad_number": 3, "academy_team": "Vertex Beta", "age": 17, "skill_rating": 77},
        {"player_id": "P023", "name": "Hassan Mansour", "position": "Goalkeeper", "squad_number": 1, "academy_team": "Vertex Beta", "age": 18, "skill_rating": 83},
        {"player_id": "P024", "name": "Oliver Tremblay", "position": "Goalkeeper", "squad_number": 12, "academy_team": "Vertex Beta", "age": 17, "skill_rating": 73}
    ]

    with open('data/raw/players.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['player_id', 'name', 'position', 'squad_number', 'academy_team', 'age'])
        for p in sorted(players, key=lambda x: x['player_id']):
            writer.writerow([p['player_id'], p['name'], p['position'], p['squad_number'], p['academy_team'], p['age']])

    # 15 Historical Academy Matches
    matches = [
        {"match_id": "M01", "date": "2026-01-10", "team": "Vertex Alpha", "opponent": "Metro Youth FC", "venue": "Home", "goals_for": 3, "goals_against": 1, "result": "WIN"},
        {"match_id": "M02", "date": "2026-01-17", "team": "Vertex Alpha", "opponent": "Coastal United Academy", "venue": "Away", "goals_for": 2, "goals_against": 2, "result": "DRAW"},
        {"match_id": "M03", "date": "2026-01-24", "team": "Vertex Alpha", "opponent": "Highland Athletic", "venue": "Home", "goals_for": 4, "goals_against": 0, "result": "WIN"},
        {"match_id": "M04", "date": "2026-01-31", "team": "Vertex Alpha", "opponent": "Silverstone Rovers", "venue": "Away", "goals_for": 1, "goals_against": 2, "result": "LOSS"},
        {"match_id": "M05", "date": "2026-02-07", "team": "Vertex Alpha", "opponent": "Northern Stars Academy", "venue": "Home", "goals_for": 2, "goals_against": 1, "result": "WIN"},
        {"match_id": "M06", "date": "2026-02-14", "team": "Vertex Alpha", "opponent": "Apex Elite Youth", "venue": "Away", "goals_for": 3, "goals_against": 2, "result": "WIN"},
        {"match_id": "M07", "date": "2026-02-21", "team": "Vertex Alpha", "opponent": "Cascade FC Academy", "venue": "Home", "goals_for": 2, "goals_against": 0, "result": "WIN"},
        {"match_id": "M08", "date": "2026-02-28", "team": "Vertex Alpha", "opponent": "Vertex Beta", "venue": "Neutral", "goals_for": 2, "goals_against": 2, "result": "DRAW"},
        {"match_id": "M09", "date": "2026-01-11", "team": "Vertex Beta", "opponent": "Summit City Boys", "venue": "Home", "goals_for": 2, "goals_against": 0, "result": "WIN"},
        {"match_id": "M10", "date": "2026-01-18", "team": "Vertex Beta", "opponent": "Lakeside Sporting", "venue": "Away", "goals_for": 1, "goals_against": 1, "result": "DRAW"},
        {"match_id": "M11", "date": "2026-01-25", "team": "Vertex Beta", "opponent": "Valley Juniors", "venue": "Home", "goals_for": 3, "goals_against": 1, "result": "WIN"},
        {"match_id": "M12", "date": "2026-02-01", "team": "Vertex Beta", "opponent": "Metro Youth FC", "venue": "Away", "goals_for": 0, "goals_against": 1, "result": "LOSS"},
        {"match_id": "M13", "date": "2026-02-08", "team": "Vertex Beta", "opponent": "Silverstone Rovers", "venue": "Home", "goals_for": 2, "goals_against": 1, "result": "WIN"},
        {"match_id": "M14", "date": "2026-02-15", "team": "Vertex Beta", "opponent": "Highland Athletic", "venue": "Away", "goals_for": 4, "goals_against": 2, "result": "WIN"},
        {"match_id": "M15", "date": "2026-02-22", "team": "Vertex Beta", "opponent": "Apex Elite Youth", "venue": "Home", "goals_for": 1, "goals_against": 0, "result": "WIN"}
    ]

    with open('data/raw/matches.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['match_id', 'date', 'team', 'opponent', 'venue', 'goals_for', 'goals_against', 'result'])
        for m in matches:
            writer.writerow([m['match_id'], m['date'], m['team'], m['opponent'], m['venue'], m['goals_for'], m['goals_against'], m['result']])

    # Generate match performances & pass interactions
    performances = []
    interactions = []

    # Map team to players
    alpha_players = [p for p in players if p['academy_team'] == 'Vertex Alpha']
    beta_players = [p for p in players if p['academy_team'] == 'Vertex Beta']

    for m in matches:
        match_id = m['match_id']
        team_name = m['team']
        team_players = alpha_players if team_name == 'Vertex Alpha' else beta_players
        
        # In match M08 (derby), both teams played!
        participating_rosters = [team_players]
        if match_id == "M08":
            participating_rosters = [alpha_players, beta_players]

        for squad in participating_rosters:
            # Pick starters (1 GK, 4 DEF, 4 MID, 2 FWD)
            gks = [p for p in squad if p['position'] == 'Goalkeeper']
            defs = [p for p in squad if p['position'] == 'Defender']
            mids = [p for p in squad if p['position'] == 'Midfielder']
            fwds = [p for p in squad if p['position'] == 'Forward']

            # Primary goalkeeper gets 90 mins most matches
            starter_gk = gks[0] if random.random() > 0.15 else gks[1]
            bench_gk = gks[1] if starter_gk == gks[0] else gks[0]

            match_lineup = [starter_gk] + defs + mids + fwds

            # Record stats for each player in squad
            for p in squad:
                is_starter = (p == starter_gk) or (p in defs) or (p in mids) or (p in fwds)
                skill = p['skill_rating'] / 100.0

                if is_starter:
                    minutes = random.choice([75, 80, 85, 90, 90, 90])
                else:
                    minutes = random.choice([0, 0, 15, 20, 25, 30])

                if minutes == 0:
                    continue

                pos = p['position']
                goals = 0
                assists = 0
                shots = 0
                tackles = 0
                interceptions = 0
                pass_attempts = 0
                pass_completed = 0

                ratio = minutes / 90.0

                if pos == 'Forward':
                    goals = np.random.poisson(0.7 * skill * ratio)
                    assists = np.random.poisson(0.35 * skill * ratio)
                    shots = goals + np.random.poisson(2.2 * skill * ratio)
                    pass_attempts = int(random.randint(18, 34) * ratio)
                    pass_completed = int(pass_attempts * (0.72 + 0.15 * skill + random.uniform(-0.04, 0.04)))
                    tackles = int(random.randint(0, 2) * ratio)
                    interceptions = int(random.randint(0, 2) * ratio)

                elif pos == 'Midfielder':
                    goals = np.random.poisson(0.25 * skill * ratio)
                    assists = np.random.poisson(0.55 * skill * ratio)
                    shots = goals + np.random.poisson(1.4 * skill * ratio)
                    pass_attempts = int(random.randint(45, 75) * ratio)
                    pass_completed = int(pass_attempts * (0.80 + 0.14 * skill + random.uniform(-0.03, 0.03)))
                    tackles = int(random.randint(2, 6) * ratio)
                    interceptions = int(random.randint(1, 5) * ratio)

                elif pos == 'Defender':
                    goals = np.random.poisson(0.08 * skill * ratio)
                    assists = np.random.poisson(0.12 * skill * ratio)
                    shots = goals + np.random.poisson(0.5 * ratio)
                    pass_attempts = int(random.randint(35, 60) * ratio)
                    pass_completed = int(pass_attempts * (0.82 + 0.12 * skill + random.uniform(-0.03, 0.03)))
                    tackles = int(random.randint(3, 8) * ratio)
                    interceptions = int(random.randint(2, 7) * ratio)

                elif pos == 'Goalkeeper':
                    goals = 0
                    assists = 0
                    shots = 0
                    pass_attempts = int(random.randint(20, 38) * ratio)
                    pass_completed = int(pass_attempts * (0.70 + 0.12 * skill + random.uniform(-0.04, 0.04)))
                    tackles = int(random.randint(0, 1) * ratio)
                    interceptions = int(random.randint(0, 2) * ratio)

                pass_completed = min(pass_completed, pass_attempts)
                pass_accuracy = round((pass_completed / pass_attempts * 100.0) if pass_attempts > 0 else 0.0, 1)

                # Realistic match rating calculation (WhoScored / Opta scale 5.0 - 9.4)
                # Base rating 6.4 centered around typical performance
                base_rating = 6.4 + (skill - 0.8) * 1.8

                # Match context (win/draw/loss & score margin)
                result_mod = 0.45 if m['result'] == 'WIN' else (-0.55 if m['result'] == 'LOSS' else 0.05)
                goal_diff = m['goals_for'] - m['goals_against']
                team_diff_mod = min(0.5, max(-0.5, goal_diff * 0.12))

                # Event contributions
                goal_contrib = goals * 0.90
                assist_contrib = assists * 0.60
                shot_contrib = min(0.35, max(0.0, (shots - goals) * 0.08))

                # Passing efficiency contribution
                if pass_attempts >= 15:
                    if pass_accuracy >= 92.0:
                        pass_contrib = 0.35
                    elif pass_accuracy >= 87.0:
                        pass_contrib = 0.18
                    elif pass_accuracy < 78.0:
                        pass_contrib = -0.35
                    else:
                        pass_contrib = 0.0
                else:
                    pass_contrib = 0.0

                # Defensive stops
                def_contrib = min(0.75, (tackles * 0.07) + (interceptions * 0.07))

                # Clean sheet / defensive concession
                clean_sheet = 1 if (m['goals_against'] == 0 and pos in ['Defender', 'Goalkeeper']) else 0
                if pos in ['Defender', 'Goalkeeper']:
                    if clean_sheet:
                        def_clean_contrib = 0.50
                    else:
                        def_clean_contrib = -0.18 * m['goals_against']
                else:
                    def_clean_contrib = 0.0

                # Form fluctuation across matches (real-life variance)
                match_luck = random.gauss(0, 0.40)

                raw_rating = base_rating + result_mod + team_diff_mod + goal_contrib + assist_contrib + shot_contrib + pass_contrib + def_contrib + def_clean_contrib + match_luck

                # Substitutes playing fewer minutes regress toward neutral median
                if minutes < 45:
                    sub_weight = minutes / 45.0
                    raw_rating = 6.3 * (1.0 - sub_weight) + raw_rating * sub_weight

                match_rating = round(max(4.8, min(9.4, raw_rating)), 1)

                performances.append({
                    "match_id": match_id,
                    "player_id": p['player_id'],
                    "minutes_played": minutes,
                    "goals": goals,
                    "assists": assists,
                    "shots": shots,
                    "passes_attempted": pass_attempts,
                    "passes_completed": pass_completed,
                    "pass_accuracy": pass_accuracy,
                    "tackles": tackles,
                    "interceptions": interceptions,
                    "clean_sheet": clean_sheet,
                    "match_rating": match_rating
                })

            # Generate passing interaction graph edges for players active in this match
            active_in_match = [p for p in squad if any(perf['player_id'] == p['player_id'] and perf['match_id'] == match_id and perf['minutes_played'] >= 20 for perf in performances)]
            
            # Interaction affinity matrix based on positional chemistry
            for p1 in active_in_match:
                for p2 in active_in_match:
                    if p1['player_id'] >= p2['player_id']:
                        continue # Undirected link or unique pair
                    
                    pos1, pos2 = p1['position'], p2['position']
                    # Natural soccer connectivity base
                    weight_base = 0
                    if (pos1, pos2) in [('Defender', 'Defender'), ('Midfielder', 'Midfielder')]:
                        weight_base = random.randint(6, 16)
                    elif (pos1, pos2) in [('Defender', 'Midfielder'), ('Midfielder', 'Defender')]:
                        weight_base = random.randint(8, 20)
                    elif (pos1, pos2) in [('Midfielder', 'Forward'), ('Forward', 'Midfielder')]:
                        weight_base = random.randint(6, 14)
                    elif (pos1, pos2) in [('Goalkeeper', 'Defender'), ('Defender', 'Goalkeeper')]:
                        weight_base = random.randint(4, 12)
                    elif (pos1, pos2) in [('Goalkeeper', 'Midfielder'), ('Midfielder', 'Goalkeeper')]:
                        weight_base = random.randint(2, 6)
                    elif (pos1, pos2) in [('Forward', 'Forward')]:
                        weight_base = random.randint(3, 9)
                    else:
                        weight_base = random.randint(0, 3)

                    if weight_base > 0:
                        combined_passes = weight_base + int(random.uniform(-2, 3))
                        combined_passes = max(1, combined_passes)
                        successful_passes = int(combined_passes * (0.78 + 0.1 * ((p1['skill_rating'] + p2['skill_rating']) / 200.0)))
                        successful_passes = min(combined_passes, max(1, successful_passes))

                        interactions.append({
                            "match_id": match_id,
                            "source_player_id": p1['player_id'],
                            "target_player_id": p2['player_id'],
                            "pass_count": combined_passes,
                            "successful_pass_count": successful_passes
                        })

    with open('data/raw/match_performances.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['match_id', 'player_id', 'minutes_played', 'goals', 'assists', 'shots', 'passes_attempted', 'passes_completed', 'pass_accuracy', 'tackles', 'interceptions', 'clean_sheet', 'match_rating'])
        for p in performances:
            writer.writerow([p['match_id'], p['player_id'], p['minutes_played'], p['goals'], p['assists'], p['shots'], p['passes_attempted'], p['passes_completed'], p['pass_accuracy'], p['tackles'], p['interceptions'], p['clean_sheet'], p['match_rating']])

    with open('data/raw/pass_interactions.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['match_id', 'source_player_id', 'target_player_id', 'pass_count', 'successful_pass_count'])
        for inter in interactions:
            writer.writerow([inter['match_id'], inter['source_player_id'], inter['target_player_id'], inter['pass_count'], inter['successful_pass_count']])

    print(f"Generated Synthetic Demo Dataset successfully:")
    print(f" - Players: {len(players)}")
    print(f" - Matches: {len(matches)}")
    print(f" - Match Performances: {len(performances)}")
    print(f" - Pass Interactions: {len(interactions)}")

if __name__ == '__main__':
    generate()
