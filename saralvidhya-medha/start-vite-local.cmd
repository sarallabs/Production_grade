@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\npx.cmd" vite --host 127.0.0.1 --port 5173 --config vite.config.ts --configLoader runner
