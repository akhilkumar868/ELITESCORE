# Athletix - End-to-End Batch Pipeline Runner
# Team: Vertex Eleven
#
# Pipeline Architecture:
# Raw Match CSVs -> Java (OOP & Graph) -> player_stats.csv -> Python (Scikit-Learn) -> performance_scores.csv -> Java (PriorityQueue Top-K) -> final_rankings.csv & Frontend JSON

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "       ATHLETIX BATCH PROCESSING PIPELINE - TEAM VERTEX ELEVEN     " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Compile Java Engine
Write-Host "`n[STEP 1/4] Compiling Java Engine..." -ForegroundColor Yellow
if (!(Test-Path "java-engine/bin")) {
    New-Item -ItemType Directory -Path "java-engine/bin" -Force | Out-Null
}
javac -d java-engine/bin java-engine/src/com/vertexeleven/athletix/model/*.java java-engine/src/com/vertexeleven/athletix/graph/*.java java-engine/src/com/vertexeleven/athletix/ranking/*.java java-engine/src/com/vertexeleven/athletix/io/*.java java-engine/src/com/vertexeleven/athletix/*.java
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Java compilation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Java compilation successful." -ForegroundColor Green

# 2. Run Java Phase 1
Write-Host "`n[STEP 2/4] Running Java Phase 1 (Data Ingest, OOP Stats & Interaction Graph)..." -ForegroundColor Yellow
java -cp java-engine/bin com.vertexeleven.athletix.AthletixEngine --phase=1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Java Phase 1 execution failed!" -ForegroundColor Red
    exit 1
}

# 3. Run Python AI Regression
Write-Host "`n[STEP 3/4] Running Python AI Regression (Scikit-Learn Modeling)..." -ForegroundColor Yellow
python python-model/src/train_and_score.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Python regression modeling failed!" -ForegroundColor Red
    exit 1
}

# 4. Run Java Phase 2
Write-Host "`n[STEP 4/4] Running Java Phase 2 (PriorityQueue Heap Top-K & Export)..." -ForegroundColor Yellow
java -cp java-engine/bin com.vertexeleven.athletix.AthletixEngine --phase=2
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Java Phase 2 execution failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n==================================================================" -ForegroundColor Green
Write-Host "   ATHLETIX BATCH PIPELINE COMPLETED SUCCESSFULLY!                " -ForegroundColor Green
Write-Host "   Data synchronized to frontend/public/data/ and frontend/src/data/" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
