@echo off
chcp 65001 >nul
title Entrenador Aena - Actualizar
cd /d "%~dp0"

echo ==========================================================
echo   Entrenador Aena - actualizar preguntas y subir a GitHub
echo ==========================================================
echo.
echo Te va a pedir la contrasena de acceso a la app (la misma que
echo usas para entrar). No se comparte con nadie ni se sube a
echo ningun sitio: se usa solo en tu ordenador para cifrar las
echo preguntas antes de subirlas.
echo.
set /p AENA_PW=Contrasena:

if "%AENA_PW%"=="" (
  echo.
  echo No has escrito nada. Vuelve a intentarlo.
  pause
  exit /b 1
)

echo.
echo Cifrando preguntas...
call node scripts\encrypt.mjs
if errorlevel 1 (
  echo.
  echo Algo ha fallado cifrando las preguntas. Revisa el mensaje de
  echo arriba: lo mas probable es que la contrasena no sea correcta.
  pause
  exit /b 1
)

echo.
echo Subiendo cambios a GitHub...
git add data\real.enc.json
git commit -m "Actualiza preguntas reales cifradas"
git push origin main

echo.
echo ==========================================================
echo   Listo. En 1-2 minutos la app en
echo   https://amenedorubn.github.io/entrenador-aena/
echo   tendra las preguntas actualizadas.
echo ==========================================================
pause
