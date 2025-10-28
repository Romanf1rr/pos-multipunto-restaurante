#!/usr/bin/env python3

# Leer el archivo
with open('UnifiedPOSView.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Cambios específicos para responsive
replacements = [
    # Contenedor principal
    ('className="h-full flex flex-col"', 'className="min-h-screen flex flex-col bg-gray-50"'),
    
    # Header
    ('className="bg-white shadow-sm border-b p-4"', 'className="bg-white shadow-sm border-b p-2 sm:p-4"'),
    ('className="flex items-center justify-between"', 'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"'),
    ('className="text-2xl font-bold text-gray-800">POS Unificado', 'className="text-xl sm:text-2xl font-bold text-gray-800">POS Unificado'),
    
    # Botones del header
    ('className="flex space-x-2"', 'className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"'),
    ('flex items-center px-4 py-2 rounded-lg', 'flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto'),
    
    # Layout principal
    ('className="flex flex-1"', 'className="flex flex-col md:flex-row flex-1 overflow-hidden"'),
    
    # Panel izquierdo
    ('className="w-1/4 bg-white shadow-lg p-4"', 'className="w-full md:w-1/3 lg:w-1/4 bg-white shadow-lg p-3 sm:p-4 border-b md:border-b-0 md:border-r max-h-[50vh] md:max-h-full overflow-y-auto"'),
    
    # Grid de mesas
    ('className="grid grid-cols-2 gap-3"', 'className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-2 sm:gap-3"'),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f"✓ Reemplazado: {old[:50]}...")
    else:
        print(f"✗ No encontrado: {old[:50]}...")

# Guardar
with open('UnifiedPOSView.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ Cambios responsive aplicados")
