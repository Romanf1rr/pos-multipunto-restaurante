@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo 📤 ==========================================
echo    Sistema POS - Auto Push a GitHub
echo    Subida Automatica de Cambios
echo ==========================================
echo.

REM Verificar que estamos en la carpeta correcta
if not exist ".git" (
    echo ❌ Error: No estas en la carpeta del proyecto git
    echo    Asegurate de estar en: pos-multipunto-restaurante
    pause
    exit /b 1
)

REM Verificar si Git está instalado
git --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Git no encontrado!
    echo    Descarga e instala Git desde: https://git-scm.com
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('git --version') do echo ✅ %%i
)

echo.
echo 🔍 Verificando estado del repositorio...

REM Obtener branch actual
for /f "tokens=*" %%i in ('git branch --show-current') do set "current_branch=%%i"
echo 🌿 Branch actual: !current_branch!

REM Verificar si hay cambios para hacer commit
git diff --quiet
if errorlevel 1 (
    set "hay_cambios=si"
) else (
    git diff --cached --quiet
    if errorlevel 1 (
        set "hay_cambios=si"
    ) else (
        set "hay_cambios=no"
    )
)

if "!hay_cambios!"=="no" (
    echo ℹ️  No hay cambios para subir
    echo.
    echo 📋 Estado actual:
    git status --short
    echo.
    echo ✅ El repositorio está actualizado
    pause
    exit /b 0
)

echo.
echo 📋 Cambios encontrados:
git status --short
echo.

REM Mostrar archivos modificados con más detalle
echo 📝 Archivos que se subirán:
git diff --name-only
git diff --cached --name-only
echo.

REM Preguntar si desea continuar
set /p "continuar=¿Quieres subir estos cambios? (s/n): "
if /i not "!continuar!"=="s" (
    echo ❌ Operación cancelada por el usuario
    pause
    exit /b 0
)

echo.
echo 💬 Ingresa un mensaje para el commit:
echo    💡 Ejemplos:
echo       - "feat: nueva funcionalidad de mesas"
echo       - "fix: corregir bug en carrito"
echo       - "update: mejorar interfaz de login"
echo       - "docs: actualizar documentación"
echo.
set /p "mensaje=Mensaje: "

if "!mensaje!"=="" (
    echo ⚠️  No se ingresó mensaje, usando mensaje automático...
    for /f "tokens=1-3 delims=/ " %%a in ("%date%") do (
        set "fecha=%%c-%%b-%%a"
    )
    for /f "tokens=1-2 delims=: " %%a in ("%time%") do (
        set "hora=%%a:%%b"
    )
    set "mensaje=update: cambios automaticos !fecha! !hora!"
)

echo.
echo 🚀 Iniciando proceso de subida...
echo.

REM Paso 1: Agregar todos los archivos
echo 📁 1/4 - Agregando archivos...
git add .
if errorlevel 1 (
    echo ❌ Error al agregar archivos
    pause
    exit /b 1
)
echo ✅ Archivos agregados correctamente

REM Paso 2: Hacer commit
echo 💾 2/4 - Creando commit...
git commit -m "!mensaje!"
if errorlevel 1 (
    echo ❌ Error al crear commit
    pause
    exit /b 1
)
echo ✅ Commit creado: !mensaje!

REM Paso 3: Verificar conexión remota
echo 🌐 3/4 - Verificando conexión remota...
git remote -v | findstr origin > nul
if errorlevel 1 (
    echo ❌ No hay repositorio remoto configurado
    echo    Configura el remoto con: git remote add origin URL_DEL_REPO
    pause
    exit /b 1
)

REM Paso 4: Push al repositorio
echo 📤 4/4 - Subiendo a GitHub...
git push origin !current_branch!
if errorlevel 1 (
    echo.
    echo ⚠️  Error al hacer push. Posibles causas:
    echo     - Necesitas autenticarte
    echo     - El branch remoto está adelante
    echo     - Problemas de conexión
    echo.
    echo 🔧 Intentando soluciones...
    
    REM Intentar pull primero por si hay cambios remotos
    echo    📥 Intentando sincronizar primero...
    git pull origin !current_branch! --rebase
    if not errorlevel 1 (
        echo    🔄 Reintentando push...
        git push origin !current_branch!
        if not errorlevel 1 (
            echo ✅ Push exitoso después de sincronizar
            goto success
        )
    )
    
    echo.
    echo ❌ No se pudo subir automáticamente
    echo 🔧 Soluciones manuales:
    echo    1. Verificar credenciales: git config --global user.name "Tu Nombre"
    echo    2. Verificar token/contraseña de GitHub
    echo    3. Ejecutar manualmente: git push origin !current_branch!
    echo.
    pause
    exit /b 1
)

:success
echo.
echo ✅ ==========================================
echo    ¡CAMBIOS SUBIDOS EXITOSAMENTE!
echo ==========================================
echo.
echo 📊 Resumen:
echo    🌿 Branch: !current_branch!
echo    💬 Mensaje: !mensaje!
echo    📤 Estado: Subido a GitHub
echo.

REM Mostrar el último commit
echo 📋 Último commit:
git log --oneline -1
echo.

REM Mostrar URL del repositorio
for /f "tokens=*" %%i in ('git remote get-url origin') do (
    set "repo_url=%%i"
    echo 🌐 Ver cambios en: !repo_url!
)

echo.
echo 💡 TIPS ÚTILES:
echo    • Para ver el historial: git log --oneline
echo    • Para ver cambios: git status
echo    • Para crear nueva rama: git checkout -b nombre-rama
echo.
echo 🎯 ¡Listo para seguir desarrollando!

pause