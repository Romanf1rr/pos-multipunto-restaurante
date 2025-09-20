// frontend/src/App.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { GlobalStateProvider } from './context/GlobalStateContext'; // ✅ AGREGAR
import POSView from './components/POSView';
import UnifiedPOSView from './components/UnifiedPOSView';
import TablesView from './components/TablesView';
import MenuManagementView from './components/MenuManagementView';
import { 
  ShoppingCart, 
  Coffee, 
  BarChart3, 
  LogOut, 
  Menu,
  Calculator,
  MapPin,
  Wifi,
  WifiOff,
  Users,
  AlertTriangle
} from 'lucide-react';

// Configuración de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api`;

// Configurar axios
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Context para el estado global
const AppContext = createContext();

// Hook para usar el contexto
const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Servicio de API
class APIService {
  constructor() {
    this.token = localStorage.getItem('pos_token');
    if (this.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('pos_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('pos_token');
    delete axios.defaults.headers.common['Authorization'];
  }

  // Autenticación
  async login(username, password, deviceId) {
    try {
      const response = await axios.post('/auth/login', {
        username,
        password,
        deviceId
      });
      
      if (response.data.success) {
        this.setToken(response.data.token);
        return response.data;
      }
      throw new Error(response.data.error || 'Error en login');
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  async logout() {
    try {
      await axios.post('/auth/logout');
      this.clearToken();
    } catch (error) {
      console.error('Error en logout:', error);
      this.clearToken();
    }
  }

  // Menú
  async getMenu() {
    const response = await axios.get('/menu');
    return response.data.menuItems;
  }

  async getCategories() {
    const response = await axios.get('/menu/categories');
    return response.data.categories;
  }

  // Mesas
  async getTables() {
    const response = await axios.get('/tables');
    return response.data.tables;
  }

  async updateTableStatus(tableId, status) {
    const response = await axios.put(`/tables/${tableId}/status`, { status });
    return response.data;
  }

  // Clientes
  async getCustomers(search = '') {
    const response = await axios.get(`/customers${search ? `?search=${search}` : ''}`);
    return response.data.customers;
  }

  async createCustomer(customerData) {
    const response = await axios.post('/customers', customerData);
    return response.data.customer;
  }

  // Ventas
  async createSale(saleData) {
    const response = await axios.post('/sales', saleData);
    return response.data;
  }

  async getTodaySales() {
    const response = await axios.get('/sales/today');
    return response.data;
  }

  async getSalesStats(period = 'today') {
    const response = await axios.get(`/sales/stats/summary?period=${period}`);
    return response.data.summary;
  }

  // Métodos para administración de menú
  async createMenuItem(itemData) {
    const response = await axios.post('/menu/items', itemData);
    return response.data.menuItem;
  }

  async updateMenuItem(itemId, itemData) {
    const response = await axios.put(`/menu/items/${itemId}`, itemData);
    return response.data.menuItem;
  }

  async deleteMenuItem(itemId) {
    const response = await axios.delete(`/menu/items/${itemId}`);
    return response.data;
  }

  async createCategory(categoryData) {
    const response = await axios.post('/menu/categories', categoryData);
    return response.data.category;
  }

  async updateCategory(categoryId, categoryData) {
    const response = await axios.put(`/menu/categories/${categoryId}`, categoryData);
    return response.data.category;
  }

  // Health check
  async healthCheck() {
    try {
      const response = await axios.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend no disponible');
    }
  }
}

// Instancia global del servicio API
const apiService = new APIService();

// Hook para conexión de red
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar backend cada 30 segundos
    const checkBackend = async () => {
      try {
        await apiService.healthCheck();
        setBackendStatus('connected');
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, backendStatus };
};

// Componente de Login
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { backendStatus } = useNetworkStatus();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const result = await apiService.login(username, password, deviceId);
      onLogin(result.user, result.shift);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">POS Moderno</h1>
          <p className="text-gray-600">Sistema Multipunto Conectado</p>
          
          <div className="mt-4 flex items-center justify-center space-x-2">
            {backendStatus === 'connected' ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-green-600 text-sm">Conectado al servidor</span>
              </>
            ) : backendStatus === 'disconnected' ? (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-red-600 text-sm">Servidor no disponible</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 text-sm">Verificando conexión...</span>
              </>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading || backendStatus !== 'connected'}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading || backendStatus !== 'connected'}
            />
          </div>
          <button
            type="submit"
            disabled={loading || backendStatus !== 'connected'}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-semibold mb-2">Usuarios disponibles:</p>
          <div className="space-y-1">
            <p><strong>Admin:</strong> admin / admin123</p>
            <p><strong>Tablet Meseros:</strong> tablet1 / tablet123</p>
            <p><strong>Tablet Caja:</strong> tablet2 / caja123</p>
            <p><strong>Mesero:</strong> mesero1 / mesa123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de indicador de estado
const StatusIndicator = () => {
  const { isOnline, backendStatus } = useNetworkStatus();

  let status, color, icon;

  if (!isOnline) {
    status = 'Sin Internet';
    color = 'bg-red-500';
    icon = <WifiOff className="w-4 h-4" />;
  } else if (backendStatus === 'disconnected') {
    status = 'Servidor Offline';
    color = 'bg-orange-500';
    icon = <AlertTriangle className="w-4 h-4" />;
  } else if (backendStatus === 'unknown') {
    status = 'Verificando...';
    color = 'bg-yellow-500';
    icon = <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>;
  } else {
    status = 'En Línea';
    color = 'bg-green-500';
    icon = <Wifi className="w-4 h-4" />;
  }

  return (
    <div className={`fixed top-4 right-4 ${color} text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium z-50`}>
      {icon}
      <span>{status}</span>
    </div>
  );
};

// Componente del Header
const Header = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Coffee className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">POS Moderno - Conectado</h1>
            <p className="text-sm text-gray-600">
              Usuario: {user.name} ({user.role})
            </p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
};

// Componente del Sidebar
const Sidebar = ({ currentView, setCurrentView }) => {
  const menuOptions = [
    { id: 'pos', icon: ShoppingCart, label: 'Punto de Venta', color: 'blue' },
    { id: 'tables', icon: MapPin, label: 'Mesas', color: 'purple' },
    { id: 'menu', icon: Menu, label: 'Administrar Menú', color: 'green' },
    { id: 'sales', icon: BarChart3, label: 'Ventas del Día', color: 'orange' },
    { id: 'reports', icon: Calculator, label: 'Reportes', color: 'pink' },
    { id: 'users', icon: Users, label: 'Usuarios', color: 'green' },
    { id: 'test', icon: Wifi, label: 'Pruebas', color: 'gray' }
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 px-4 py-6">
      <nav className="space-y-2">
        {menuOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentView === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => setCurrentView(option.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? `bg-${option.color}-100 text-${option.color}-700 shadow-sm` 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{option.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

// Vista de prueba de conexión
const TestView = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {};

    try {
      const health = await apiService.healthCheck();
      results.health = { success: true, data: health };
    } catch (error) {
      results.health = { success: false, error: error.message };
    }

    try {
      const menu = await apiService.getMenu();
      results.menu = { success: true, count: menu.length };
    } catch (error) {
      results.menu = { success: false, error: error.message };
    }

    try {
      const tables = await apiService.getTables();
      results.tables = { success: true, count: tables.length };
    } catch (error) {
      results.tables = { success: false, error: error.message };
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Prueba de Conexión Backend</h2>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Probando...' : 'Ejecutar Pruebas'}
      </button>

      <div className="space-y-4">
        {Object.entries(testResults).map(([test, result]) => (
          <div key={test} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold capitalize">{test}</h3>
              {result.success ? (
                <span className="text-green-600">✅ Éxito</span>
              ) : (
                <span className="text-red-600">❌ Error</span>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {result.success ? (
                <pre>{JSON.stringify(result.data || { count: result.count }, null, 2)}</pre>
              ) : (
                <span className="text-red-600">{result.error}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente Principal de la aplicación interna
const MainApp = () => {
  const [user, setUser] = useState(null);
  const [shift, setShift] = useState(null);
  const [currentView, setCurrentView] = useState('pos');

  useEffect(() => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      localStorage.removeItem('pos_token');
    }
  }, []);

  const handleLogin = (userData, shiftData) => {
    setUser(userData);
    setShift(shiftData);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    }
    setUser(null);
    setShift(null);
    // Limpiar estado global al cerrar sesión
    localStorage.removeItem('pos_global_state');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'pos':
        return <UnifiedPOSView apiService={apiService} user={user} />;
      case 'tables':
        return <TablesView apiService={apiService} user={user} />;
      case 'menu':
        return <MenuManagementView apiService={apiService} user={user} />;
      case 'test':
        return <TestView />;
      case 'sales':
        return <div className="p-6"><h2 className="text-2xl font-bold">Ventas del Día</h2><p>Vista en desarrollo...</p></div>;
      case 'reports':
        return <div className="p-6"><h2 className="text-2xl font-bold">Reportes</h2><p>Vista en desarrollo...</p></div>;
      case 'users':
        return <div className="p-6"><h2 className="text-2xl font-bold">Gestión de Usuarios</h2><p>Vista en desarrollo...</p></div>;
      default:
        return <UnifiedPOSView apiService={apiService} user={user} />;
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <AppContext.Provider value={{ user, shift, apiService }}>
      <div className="h-screen flex flex-col bg-gray-50">
        <StatusIndicator />
        <Header user={user} onLogout={handleLogout} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
          <main className="flex-1 overflow-y-auto">
            {renderCurrentView()}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
};

// Componente raíz con GlobalStateProvider
const App = () => {
  return (
    <GlobalStateProvider>
      <MainApp />
    </GlobalStateProvider>
  );
};

export default App;