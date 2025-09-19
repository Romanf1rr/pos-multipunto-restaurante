@echo off
echo 🏪 ==========================================
echo    Sistema POS Multipunto - Instalacion
echo    Configuracion para Windows
echo ==========================================
echo.

REM Verificar que estamos en la carpeta correcta
if not exist ".git" (
    echo ❌ Error: No estas en la carpeta del proyecto git
    echo    Asegurate de estar en: pos-multipunto-restaurante
    pause
    exit /b 1
)

echo 📁 Creando estructura de carpetas...

REM Crear estructura frontend
mkdir frontend 2>nul
mkdir frontend\src 2>nul
mkdir frontend\src\components 2>nul
mkdir frontend\src\pages 2>nul
mkdir frontend\src\hooks 2>nul
mkdir frontend\src\services 2>nul
mkdir frontend\src\utils 2>nul
mkdir frontend\public 2>nul

REM Crear estructura backend
mkdir backend 2>nul
mkdir backend\routes 2>nul
mkdir backend\models 2>nul
mkdir backend\middleware 2>nul
mkdir backend\database 2>nul
mkdir backend\scripts 2>nul

REM Crear otras carpetas
mkdir docs 2>nul
mkdir docs\sesiones 2>nul
mkdir scripts 2>nul
mkdir database 2>nul
mkdir database\backups 2>nul
mkdir logs 2>nul

echo ✅ Estructura de carpetas creada exitosamente!
echo.

echo 📋 Carpetas creadas:
echo    📁 frontend/src/{components,pages,hooks,services,utils}
echo    📁 frontend/public/
echo    📁 backend/{routes,models,middleware,database,scripts}
echo    📁 docs/sesiones/
echo    📁 scripts/
echo    📁 database/backups/
echo    📁 logs/
echo.

echo 📝 Proximos pasos:
echo    1. Crear los archivos package.json
echo    2. Crear el archivo .env.example
echo    3. Crear el README.md actualizado
echo    4. Hacer git add y git commit
echo.

echo ✨ ¡Listo para continuar!
pause