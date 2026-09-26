@echo off
cd /d "%~dp0"
node scripts\watch.mjs --once
pause
