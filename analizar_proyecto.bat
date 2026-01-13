@echo off
echo Analizando estructura del proyecto...
echo.

echo ===== ARCHIVOS EN RAÍZ =====
dir /B *.html *.js *.css *.json *.md 2>nul

echo.
echo ===== CARPETAS =====
dir /AD /B

echo.
echo ===== CONTENIDO DE JS/ =====
if exist js\ dir js\ /B

echo.
echo ===== CONTENIDO DE CSS/ =====
if exist css\ dir css\ /B

echo.
echo ===== CONTENIDO DE ASSETS/ =====
if exist assets\ dir assets\ /S /B

echo.
echo ===== RUTAS EN Reportar_Denuncia.html =====
findstr /C:"src=" Reportar_Denuncia.html 2>nul | findstr /C:".js" /C:".css" /C:"images"

pause > nul
