with open('App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar el Sidebar y reemplazarlo por versión responsive
old_sidebar = '''// Sidebar
const Sidebar = ({ currentView, setCurrentView, user }) => {
  const menuOptions = [
    { id: 'pos', label: 'POS Unificado', icon: '🛒' },
    ...(user.role === 'admin' ? [
      { id: 'menu', label: 'Gestión Menú', icon: '📋' },
      { id: 'inventario', label: 'Gestión Inventario', icon: '📦' } // <-- AGREGADO INVENTARIO
    ] : [])
  ];
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 px-4 py-6">
      <nav className="space-y-2">
        {menuOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setCurrentView(option.id)}
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
  );
};'''

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
    // Cerrar sidebar en móviles después de seleccionar
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };
  
  return (
    <>
      {/* Overlay para cerrar sidebar en móviles */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-gray-50 border-r border-gray-200 px-4 py-6
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Botón cerrar en móviles */}
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
};'''

if old_sidebar in content:
    content = content.replace(old_sidebar, new_sidebar)
    print("✓ Sidebar reemplazado")
else:
    print("✗ No se encontró el Sidebar exacto")

# Actualizar Header para incluir botón hamburguesa
old_header = '''// Header
const Header = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">POS Sistema Multipunto</h1>
          <p className="text-sm text-gray-600">
            Usuario: {user.name} ({user.role})
          </p>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
};'''

new_header = '''// Header con botón hamburguesa
const Header = ({ user, onLogout, toggleSidebar }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Botón hamburguesa (solo móviles) */}
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-600 hover:text-gray-800 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">POS Sistema Multipunto</h1>
            <p className="text-xs md:text-sm text-gray-600">
              Usuario: {user.name} ({user.role})
            </p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm md:text-base"
        >
          <span>🚪</span>
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
};'''

if old_header in content:
    content = content.replace(old_header, new_header)
    print("✓ Header actualizado")
else:
    print("✗ No se encontró el Header exacto")

with open('App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ Cambios aplicados")
