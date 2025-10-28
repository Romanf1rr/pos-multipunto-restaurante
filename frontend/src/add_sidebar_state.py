with open('App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Buscar MainApp y agregar estado
for i, line in enumerate(lines):
    if 'const [currentView, setCurrentView] = useState' in line:
        # Agregar después de esta línea
        lines.insert(i+1, "  const [sidebarOpen, setSidebarOpen] = useState(false);\n")
        print(f"✓ Estado agregado después de línea {i+1}")
        break

with open('App.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
