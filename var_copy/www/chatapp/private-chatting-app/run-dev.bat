@echo off
echo Starting CLIENT and SERVER...

REM Start SERVER
start "SERVER" cmd /k "cd /d %~dp0server && pnpm.cmd install && pnpm.cmd run dev"

REM Start CLIENT
start "CLIENT" cmd /k "cd /d %~dp0client && pnpm.cmd install && pnpm.cmd run dev"

echo If you see two windows running commands, it worked.
pause
