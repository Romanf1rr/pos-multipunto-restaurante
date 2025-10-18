with open('App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Buscar "return (" del Sidebar
for i, line in enumerate(lines):
    if 'const Sidebar =' in lines[i-1] if i > 0 else False:
        # Buscar el return de este componente
        for j in range(i, min(i+30, len(lines))):
            if 'return (' in lines[j]:
                # Insertar después del return (
                lines.insert(j+1, '''    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
''')
                # Buscar el </aside> y cambiar por </aside>\n</>
                for k in range(j, min(j+50, len(lines))):
                    if '</aside>' in lines[k] and '// Header' in lines[k+1] if k+1 < len(lines) else False:
                        lines[k] = lines[k].rstrip() + '\n    </>\n'
                        print(f"✓ Overlay agregado y componente cerrado correctamente")
                        break
                break
        break

with open('App.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
