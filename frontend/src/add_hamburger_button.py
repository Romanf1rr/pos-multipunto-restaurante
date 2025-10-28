with open('App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Actualizar firma del Header
content = content.replace(
    'const Header = ({ user, onLogout })',
    'const Header = ({ user, onLogout, toggleSidebar })'
)

# Agregar botón hamburguesa después del primer <div> del header
old_header_start = '''<header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>'''

new_header_start = '''<header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Botón hamburguesa */}
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-600 hover:text-gray-800 p-2 -ml-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div>'''

content = content.replace(old_header_start, new_header_start)

# Cerrar el div adicional
content = content.replace(
    '''</p>
        </div>''',
    '''</p>
          </div>
        </div>'''
)

with open('App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Botón hamburguesa agregado al Header")
