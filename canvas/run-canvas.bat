@echo off
REM Canvas launcher for Windows
REM Changes to the script directory and runs the CLI with Bun

cd /d "%~dp0"
bun run src\cli.ts %*

REM If there was an error, pause so we can see it
if %ERRORLEVEL% neq 0 (
    echo.
    echo Error occurred. Press any key to close...
    pause >nul
)
