with open('App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Modificar firma del Sidebar
content = content.replace(
    'const Sidebar = ({ currentView, setCurrentView, user }) => {',
    'const Sidebar = ({ currentView, setCurrentView, user, isOpen, setIsOpen }) => {'
)

# 2. Modificar className del aside
old_aside = '    <aside className="w-64 bg-gray-50 border-r border-gray-200 px-4 py-6">'
new_aside = '''    <aside className={`
        w-64 bg-gray-50 border-r border-gray-200 px-4 py-6
        fixed md:static inset-y-0 left-0 z-50
        transform transition-transform duration-300
        ${ isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>'''

content = content.replace(old_aside, new_aside)

with open('App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Sidebar modificado")
