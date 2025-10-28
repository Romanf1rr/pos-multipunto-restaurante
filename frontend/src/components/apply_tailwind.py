with open('UnifiedPOSView.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Cambios línea por línea
for i, line in enumerate(lines):
    # Línea 609: Contenedor principal
    if 'className="h-full flex flex-col"' in line:
        lines[i] = line.replace('className="h-full flex flex-col"', 'className="min-h-screen flex flex-col bg-gray-50"')
        print(f"✓ Línea {i+1}: Contenedor principal")
    
    # Header
    if 'className="bg-white shadow-sm border-b p-4"' in line and 'pos-header' not in line:
        lines[i] = line.replace('p-4"', 'p-2 sm:p-4"')
        print(f"✓ Línea {i+1}: Header padding")
    
    if 'className="flex items-center justify-between"' in line and i > 610 and i < 620:
        lines[i] = line.replace('className="flex items-center justify-between"', 'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0"')
        print(f"✓ Línea {i+1}: Header layout")
    
    # Título
    if 'className="text-2xl font-bold text-gray-800">POS Unificado' in line:
        lines[i] = line.replace('text-2xl', 'text-xl sm:text-2xl')
        print(f"✓ Línea {i+1}: Título")
    
    # Botones de tipo de orden
    if 'className="order-type-buttons flex space-x-2"' in line or ('className="flex space-x-2"' in line and i > 610 and i < 625):
        lines[i] = line.replace('className="flex space-x-2"', 'className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"')
        lines[i] = lines[i].replace('className="order-type-buttons flex space-x-2"', 'className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"')
        print(f"✓ Línea {i+1}: Contenedor de botones")
    
    # Botones individuales de orden
    if 'flex items-center px-4 py-2 rounded-lg' in line and 'Comer aquí' in lines[i+2] if i+2 < len(lines) else False:
        lines[i] = line.replace('flex items-center px-4 py-2', 'flex items-center justify-center w-full sm:w-auto px-4 py-2.5')
        print(f"✓ Línea {i+1}: Botón Comer aquí")
    elif 'flex items-center px-4 py-2 rounded-lg' in line and 'Para llevar' in lines[i+2] if i+2 < len(lines) else False:
        lines[i] = line.replace('flex items-center px-4 py-2', 'flex items-center justify-center w-full sm:w-auto px-4 py-2.5')
        print(f"✓ Línea {i+1}: Botón Para llevar")
    elif 'flex items-center px-4 py-2 rounded-lg' in line and 'A domicilio' in lines[i+2] if i+2 < len(lines) else False:
        lines[i] = line.replace('flex items-center px-4 py-2', 'flex items-center justify-center w-full sm:w-auto px-4 py-2.5')
        print(f"✓ Línea {i+1}: Botón A domicilio")
    
    # Layout principal
    if 'className="pos-main-layout flex flex-1"' in line or ('className="flex flex-1"' in line and i > 650 and i < 665):
        lines[i] = line.replace('className="flex flex-1"', 'className="flex flex-col md:flex-row flex-1 overflow-hidden"')
        lines[i] = lines[i].replace('className="pos-main-layout flex flex-1"', 'className="flex flex-col md:flex-row flex-1 overflow-hidden"')
        print(f"✓ Línea {i+1}: Layout principal")
    
    # Panel lateral
    if 'className="pos-side-panel w-1/4 bg-white shadow-lg p-4"' in line or ('className="w-1/4 bg-white shadow-lg p-4"' in line and i > 655 and i < 670):
        lines[i] = line.replace('w-1/4', 'w-full md:w-1/3 lg:w-1/4')
        lines[i] = lines[i].replace('p-4"', 'p-3 sm:p-4 max-h-[50vh] md:max-h-full overflow-y-auto"')
        print(f"✓ Línea {i+1}: Panel lateral")
    
    # Grid de mesas
    if 'className="tables-grid grid grid-cols-2 gap-3"' in line or ('className="grid grid-cols-2 gap-3"' in line and 'tables.map' in lines[i+1] if i+1 < len(lines) else False):
        lines[i] = line.replace('grid-cols-2 gap-3', 'grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3')
        print(f"✓ Línea {i+1}: Grid de mesas")

with open('UnifiedPOSView.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("\n✅ Cambios Tailwind aplicados")
