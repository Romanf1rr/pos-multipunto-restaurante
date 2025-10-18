with open('App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Modificar Header paso a paso
for i, line in enumerate(lines):
    # Cambiar firma del Header
    if 'const Header = ({ user, onLogout }) => {' in line:
        lines[i] = 'const Header = ({ user, onLogout, toggleSidebar }) => {\n'
        print(f"✓ Línea {i+1}: Firma de Header actualizada")
    
    # Agregar botón hamburguesa DENTRO del primer div
    if '<div className="flex justify-between items-center">' in line and i > 125 and i < 135:
        # El siguiente es <div> que contiene el título
        # Insertaremos el botón hamburguesa ANTES de ese div
        indent = '        '
        lines.insert(i+1, f'{indent}<button onClick={{toggleSidebar}} className="md:hidden mr-3 p-2 text-gray-600 hover:text-gray-800">\n')
        lines.insert(i+2, f'{indent}  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n')
        lines.insert(i+3, f'{indent}    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={{2}} d="M4 6h16M4 12h16M4 18h16" />\n')
        lines.insert(i+4, f'{indent}  </svg>\n')
        lines.insert(i+5, f'{indent}</button>\n')
        lines.insert(i+6, f'{indent}\n')
        print(f"✓ Línea {i+1}: Botón hamburguesa agregado")
        break

with open('App.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("\n✅ Header modificado")
