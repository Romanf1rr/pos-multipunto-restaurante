with open('App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar línea del Sidebar
sidebar_start = None
for i, line in enumerate(lines):
    if '// Sidebar' in line and 'const Sidebar' in lines[i+1] if i+1 < len(lines) else False:
        sidebar_start = i
        break

if sidebar_start:
    # Encontrar el final del componente Sidebar (antes de // Header)
    sidebar_end = None
    for i in range(sidebar_start, len(lines)):
        if '// Header' in lines[i]:
            sidebar_end = i
            break
    
    if sidebar_end:
        # Nuevo Sidebar responsive
        new_sidebar = '''// Sidebar Responsive con menú hamburguesa
const Sidebar = ({ currentView, setCurrentView, user, isOpen, setIsOpen }) => {
  const menuOptions = [
    { id: 'pos', label: 'POS Unificado', icon: '🛒' },
    ...(user.role === 'admin' ? [
      { id: 'menu', label: 'Gestión Menú', icon: '📋' },
      { id: 'inventario', label: 'Gestión Inventario', icon: '📦' }
    ] : [])
  ];
  
  const handleOptionClick = (optionId) => {
    setCurrentView(optionId);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };
  
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-gray-50 border-r border-gray-200 px-4 py-6
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-4 right-4 text-gray-600 hover:text-gray-800"
        >
          <span className="text-2xl">✕</span>
        </button>
        
        <nav className="space-y-2 mt-8 md:mt-0">
          {menuOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === option.id 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

'''
        # Reemplazar
        lines[sidebar_start:sidebar_end] = [new_sidebar]
        print(f"✓ Sidebar reemplazado (líneas {sidebar_start}-{sidebar_end})")
    else:
        print("✗ No se encontró el final del Sidebar")
else:
    print("✗ No se encontró el inicio del Sidebar")

# Guardar
with open('App.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Archivo guardado")
