@echo off
REM Athletix - End-to-End Batch Pipeline Runner (Windows Command Prompt)
REM Team: Vertex Eleven

echo ==================================================================
echo        ATHLETIX BATCH PROCESSING PIPELINE - TEAM VERTEX ELEVEN     
echo ==================================================================

echo.
echo [STEP 1/4] Compiling Java Engine...
if not exist java-engine\bin mkdir java-engine\bin
javac -d java-engine\bin java-engine\src\com\vertexeleven\athletix\model\*.java java-engine\src\com\vertexeleven\athletix\graph\*.java java-engine\src\com\vertexeleven\athletix\ranking\*.java java-engine\src\com\vertexeleven\athletix\io\*.java java-engine\src\com\vertexeleven\athletix\*.java
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java compilation failed!
    exit /b %ERRORLEVEL%
)
echo Java compilation successful.

echo.
echo [STEP 2/4] Running Java Phase 1 (Data Ingest, OOP Stats ^& Interaction Graph)...
java -cp java-engine\bin com.vertexeleven.athletix.AthletixEngine --phase=1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java Phase 1 execution failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [STEP 3/4] Running Python AI Regression (Scikit-Learn Modeling)...
python python-model\src\train_and_score.py
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python regression modeling failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [STEP 4/4] Running Java Phase 2 (PriorityQueue Heap Top-K ^& Export)...
java -cp java-engine\bin com.vertexeleven.athletix.AthletixEngine --phase=2
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Java Phase 2 execution failed!
    exit /b %ERRORLEVEL%
)

echo.
echo ==================================================================
echo    ATHLETIX BATCH PIPELINE COMPLETED SUCCESSFULLY!                
echo    Data synchronized to frontend\public\data\ and frontend\src\data\
echo ==================================================================
