with open('App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Agregar estado
content = content.replace(
    "  const [currentView, setCurrentView] = useState('pos');",
    "  const [currentView, setCurrentView] = useState('pos');\n  const [sidebarOpen, setSidebarOpen] = useState(false);"
)

# 2. Actualizar props de Header
content = content.replace(
    '      <Header user={user} onLogout={handleLogout} />',
    '      <Header user={user} onLogout={handleLogout} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />'
)

# 3. Actualizar props de Sidebar
content = content.replace(
    '        <Sidebar currentView={currentView} setCurrentView={setCurrentView} user={user} />',
    '        <Sidebar currentView={currentView} setCurrentView={setCurrentView} user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />'
)

with open('App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Estado y props actualizados")
