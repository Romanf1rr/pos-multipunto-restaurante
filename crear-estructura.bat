@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo 🏪 ==========================================
echo    Sistema POS Multipunto - Iniciando
echo    Backend + Frontend Simultaneo
echo ==========================================
echo.

REM Verificar que estamos en la carpeta correcta
if not exist ".git" (
    echo ❌ Error: No estas en la carpeta del proyecto git
    echo    Asegurate de estar en: pos-multipunto-restaurante
    pause
    exit /b 1
)

REM Verificar que existen las carpetas
if not exist "backend" (
    echo ❌ Error: Carpeta 'backend' no encontrada
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Error: Carpeta 'frontend' no encontrada
    pause
    exit /b 1
)

REM Verificar Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no encontrado! Instala desde https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Verificaciones completadas
echo.

REM Verificar si las dependencias están instaladas
echo 📦 Verificando dependencias...

if not exist "backend\node_modules" (
    echo ⚠️  Dependencias del backend no instaladas
    echo    Instalando dependencias del backend...
    cd backend
    call npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias del backend
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Dependencias del backend instaladas
)

if not exist "frontend\node_modules" (
    echo ⚠️  Dependencias del frontend no instaladas
    echo    Instalando dependencias del frontend...
    cd frontend
    call npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias del frontend
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Dependencias del frontend instaladas
)

echo.
echo 🚀 Iniciando servicios...
echo.
echo 📡 BACKEND: http://localhost:3001
echo 🌐 FRONTEND: http://localhost:3000
echo.
echo ⚠️  Se abrirán 2 ventanas nuevas:
echo    - Una para el servidor backend (Node.js)
echo    - Una para el servidor frontend (React)
echo.
echo 💡 Para detener los servicios:
echo    - Presiona Ctrl+C en cada ventana
echo    - O cierra esta ventana principal
echo.

timeout /t 3 /nobreak > nul

REM Iniciar Backend en ventana separada
echo 🔧 Iniciando Backend...
start "POS Backend - Puerto 3001" cmd /k "cd /d %CD%\backend && echo 🔧 === BACKEND POS === && echo Puerto: 3001 && echo Presiona Ctrl+C para detener && echo. && npm start"

REM Esperar un poco para que el backend inicie
timeout /t 5 /nobreak > nul

REM Iniciar Frontend en ventana separada
echo 🌐 Iniciando Frontend...
start "POS Frontend - Puerto 3000" cmd /k "cd /d %CD%\frontend && echo 🌐 === FRONTEND POS === && echo Puerto: 3000 && echo Presiona Ctrl+C para detener && echo Se abrirá automáticamente en el navegador && echo. && npm start"

echo.
echo ✅ ¡Servicios iniciados!
echo.
echo 📋 Estado de los servicios:
echo    🔧 Backend:  Iniciando en puerto 3001...
echo    🌐 Frontend: Iniciando en puerto 3000...
echo.
echo 🌍 URLs disponibles:
echo    👨‍💼 Panel Admin:    http://localhost:3000/admin
echo    📱 POS Tablets:     http://localhost:3000/pos
echo    🔐 Login:           http://localhost:3000/login
echo    📊 API Backend:     http://localhost:3001/api
echo.
echo ⏳ Esperando a que los servicios estén listos...
echo    El navegador se abrirá automáticamente en unos segundos
echo.
echo 💡 CONSEJOS:
echo    • Mantén esta ventana abierta para ver el estado
echo    • El frontend se recargará automáticamente al hacer cambios
echo    • Revisa las otras ventanas si hay errores
echo.

REM Esperar y verificar que los servicios estén funcionando
timeout /t 10 /nobreak > nul

echo 🔍 Verificando servicios...

REM Verificar backend
curl -s http://localhost:3001 > nul 2>&1
if errorlevel 1 (
    echo ⚠️  Backend aún iniciando... (normal si es la primera vez)
) else (
    echo ✅ Backend funcionando correctamente
)

REM Verificar frontend
curl -s http://localhost:3000 > nul 2>&1
if errorlevel 1 (
    echo ⚠️  Frontend aún iniciando...
) else (
    echo ✅ Frontend funcionando correctamente
)

echo.
echo 🎯 ¡Sistema POS listo para usar!
echo.
echo 📱 USUARIOS DE PRUEBA:
echo    └─ admin / admin123     (Administrador)
echo    └─ tablet1 / tablet123  (Mesero)
echo    └─ tablet2 / caja123    (Cajero)
echo.
echo ❌ Para detener todo el sistema:
echo    └─ Cierra esta ventana o presiona Ctrl+C
echo.

REM Mantener la ventana abierta para monitorear
:monitor
timeout /t 30 /nobreak > nul
echo [%date% %time%] 💓 Sistema funcionando...
goto monitor