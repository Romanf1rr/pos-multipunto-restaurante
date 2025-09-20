// frontend/src/components/UnifiedPOSView.js
import React, { useState, useEffect } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';
import { 
  ShoppingCart, Users, Truck, Package, Phone, MapPin, Plus, Search, 
  Minus, Check, X, AlertTriangle 
} from 'lucide-react';

const UnifiedPOSView = ({ apiService, user }) => {
  // Estado global
  const {
    tables, customers, menuItems, categories,
    setTables, setCustomers, setMenuItems, setCategories, updateTable,
    addToCart, updateCartItem, clearCart, getCurrentCart, hasItemsInCart
  } = useGlobalState();

  // Estados locales de UI
  const [orderType, setOrderType] = useState('dine-in');
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Estado para nuevo cliente
  const [newCustomer, setNewCustomer] = useState({
    phone: '',
    name: '',
    address1: '',
    address2: '',
    city: 'Ciudad Guzmán'
  });

  // Cargar datos iniciales solo si no existen
  useEffect(() => {
    if (menuItems.length === 0 || tables.length === 0) {
      loadInitialData();
    }
  }, [menuItems.length, tables.length]);

  // Establecer categoría por defecto
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  // Efecto para sincronizar estado de mesas automáticamente
  useEffect(() => {
    tables.forEach(table => {
      const cartKey = `table-${table.id}`;
      const hasItems = hasItemsInCart(cartKey);
      
      // Si la mesa tiene productos pero está marcada como disponible, cambiarla a ocupada
      if (hasItems && table.status === 'available') {
        updateTableStatusAutomatically(table.id, 'occupied');
      }
      // Si la mesa no tiene productos pero está marcada como ocupada, cambiarla a disponible
      else if (!hasItems && table.status === 'occupied') {
        updateTableStatusAutomatically(table.id, 'available');
      }
    });
  }, [tables, hasItemsInCart, updateTable]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [categoriesData, menuData, tablesData, customersData] = await Promise.all([
        apiService.getCategories(),
        apiService.getMenu(),
        apiService.getTables(),
        loadCustomers()
      ]);
      
      setCategories(categoriesData);
      setMenuItems(menuData);
      setTables(tablesData);
      setCustomers(customersData);
    } catch (error) {
      setError('Error cargando datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar estado de mesa automáticamente
  const updateTableStatusAutomatically = async (tableId, newStatus) => {
    try {
      // Actualizar en el backend
      await apiService.updateTableStatus(tableId, newStatus);
      
      // Actualizar en el estado local
      const updatedTable = tables.find(t => t.id === tableId);
      if (updatedTable) {
        updateTable({ ...updatedTable, status: newStatus });
      }
    } catch (error) {
      console.error('Error actualizando estado de mesa automáticamente:', error);
    }
  };

  // Función para cargar clientes
  const loadCustomers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/customers`, {
        headers: {
          'Authorization': `Bearer ${apiService.token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data.customers || [];
    } catch (error) {
      console.error('Error cargando clientes:', error);
      return [];
    }
  };

  // Crear nuevo cliente
  const createCustomer = async () => {
    if (!newCustomer.phone || !newCustomer.name || !newCustomer.address1) {
      setError('Teléfono, nombre y dirección son requeridos');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiService.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCustomer)
      });

      const data = await response.json();
      
      if (data.success) {
        setCustomers([...customers, data.customer]);
        handleCustomerSelect(data.customer);
        setNewCustomer({
          phone: '',
          name: '',
          address1: '',
          address2: '',
          city: 'Ciudad Guzmán'
        });
        setError('');
      } else {
        setError(data.error || 'Error creando cliente');
      }
    } catch (error) {
      setError('Error creando cliente: ' + error.message);
    }
  };

  // Funciones de manejo de estados
  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    setSelectedTable(null);
    setSelectedCustomer(null);
    setError('');
  };

  const handleTableSelect = (table) => {
    if (orderType !== 'dine-in') return;
    setSelectedTable(table);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
  };

  // Funciones del carrito con sincronización automática
  const getCartKey = () => {
    if (orderType === 'dine-in' && selectedTable) return `table-${selectedTable.id}`;
    if (orderType === 'delivery' && selectedCustomer) return `delivery-${selectedCustomer.id}`;
    if (orderType === 'takeaway') return 'takeaway';
    return null;
  };

  const handleAddToCart = (item) => {
    const cartKey = getCartKey();
    if (!cartKey) {
      if (orderType === 'dine-in') setError('Selecciona una mesa primero');
      if (orderType === 'delivery') setError('Selecciona un cliente primero');
      return;
    }

    addToCart(cartKey, item);
    setError('');

    // Si es una mesa y está disponible, cambiarla a ocupada automáticamente
    if (orderType === 'dine-in' && selectedTable && selectedTable.status === 'available') {
      updateTableStatusAutomatically(selectedTable.id, 'occupied');
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    const cartKey = getCartKey();
    if (!cartKey) return;
    
    updateCartItem(cartKey, itemId, newQuantity);

    // Si se vacía el carrito de una mesa, cambiarla a disponible
    setTimeout(() => {
      if (orderType === 'dine-in' && selectedTable) {
        const currentCart = getCurrentCart(cartKey);
        if (currentCart.length === 0 && selectedTable.status === 'occupied') {
          updateTableStatusAutomatically(selectedTable.id, 'available');
        }
      }
    }, 100); // Pequeño delay para que se actualice el estado del carrito
  };

  const handleClearCart = () => {
    const cartKey = getCartKey();
    if (!cartKey) return;
    
    clearCart(cartKey);

    // Si se limpia el carrito de una mesa, cambiarla a disponible
    if (orderType === 'dine-in' && selectedTable && selectedTable.status === 'occupied') {
      updateTableStatusAutomatically(selectedTable.id, 'available');
    }
  };

  const getCartTotal = () => {
    const cartKey = getCartKey();
    const currentCart = getCurrentCart(cartKey);
    const subtotal = currentCart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.16;
    return subtotal + tax;
  };

  // Procesar venta con actualización de estado de mesa
  const processSale = async () => {
    const cartKey = getCartKey();
    const currentCart = getCurrentCart(cartKey);
    
    if (currentCart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        items: currentCart.map(item => ({
          id: item.id,
          quantity: item.quantity
        })),
        orderType,
        tableId: selectedTable?.id || null,
        customerId: selectedCustomer?.id || null,
        paymentMethod,
        notes: `Venta procesada por ${user.name}`,
        deviceId: `device_${user.id}`
      };

      const result = await apiService.createSale(saleData);
      
      if (result.success) {
        // Limpiar carrito
        clearCart(cartKey);
        setShowPayment(false);
        setError('');
        
        // Actualizar estado de mesa a disponible después de la venta
        if (selectedTable && orderType === 'dine-in') {
          await updateTableStatusAutomatically(selectedTable.id, 'available');
          setSelectedTable(null);
        }
        
        alert(`Venta procesada exitosamente!\nTotal: $${getCartTotal().toFixed(2)}\nFolio: ${result.sale.id}`);
      }
    } catch (error) {
      setError('Error procesando venta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el color correcto de mesa basado en carrito
  const getTableStatusColor = (table) => {
    const cartKey = `table-${table.id}`;
    const hasItems = hasItemsInCart(cartKey);
    
    // Si tiene items en el carrito, debe mostrarse como ocupada
    if (hasItems) {
      return 'bg-red-500 hover:bg-red-600';
    }
    
    // Sino, usar el estado real de la mesa
    switch (table.status) {
      case 'available': return 'bg-green-500 hover:bg-green-600';
      case 'occupied': return 'bg-red-500 hover:bg-red-600';
      case 'reserved': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'cleaning': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Filtros
  const filteredItems = menuItems.filter(item => 
    !selectedCategory || item.categoryId === selectedCategory
  );

  const filteredCustomers = customers.filter(customer =>
    customer.phone.includes(customerSearch) ||
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  if (loading && menuItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header con tipo de pedido */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">POS Unificado</h1>
          
          {/* Selector de tipo de pedido */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleOrderTypeChange('dine-in')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                orderType === 'dine-in' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Users className="mr-2" size={20} />
              Comer aquí
            </button>
            
            <button
              onClick={() => handleOrderTypeChange('takeaway')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                orderType === 'takeaway' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Package className="mr-2" size={20} />
              Para llevar
            </button>
            
            <button
              onClick={() => handleOrderTypeChange('delivery')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                orderType === 'delivery' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Truck className="mr-2" size={20} />
              A domicilio
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="flex flex-1">
        {/* Panel Izquierdo - Mesas o Clientes */}
        <div className="w-1/4 bg-white shadow-lg p-4">
          {orderType === 'dine-in' && (
            <>
              <div className="flex items-center mb-4">
                <Users className="mr-2 text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Mesas</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleTableSelect(table)}
                    className={`
                      relative p-4 rounded-lg transition-all duration-200 transform hover:scale-105
                      ${getTableStatusColor(table)}
                      ${selectedTable?.id === table.id ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
                      ${hasItemsInCart(`table-${table.id}`) ? 'ring-4 ring-orange-400' : ''}
                    `}
                  >
                    <div className="text-center text-white">
                      <div className="text-lg font-bold">Mesa {table.number}</div>
                      <div className="text-sm opacity-90">{table.capacity} personas</div>
                      {hasItemsInCart(`table-${table.id}`) && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 border-white">
                          {getCurrentCart(`table-${table.id}`).length}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {orderType === 'delivery' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Phone className="mr-2 text-orange-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-800">Clientes</h2>
                </div>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por teléfono o nombre..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCustomers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className={`w-full text-left p-3 rounded-lg transition-colors border ${
                      selectedCustomer?.id === customer.id
                        ? 'bg-orange-100 border-orange-500'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.phone}</div>
                    <div className="text-xs text-gray-500">{customer.address1}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {orderType === 'takeaway' && (
            <div className="text-center mt-8">
              <Package size={48} className="mx-auto mb-4 text-green-600" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Para Llevar</h2>
              <p className="text-gray-600">Agrega productos al pedido</p>
            </div>
          )}
        </div>

        {/* Panel Central - Menú */}
        <div className="flex-1 p-4">
          {/* Categorías */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !selectedCategory 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Items del Menú */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleAddToCart(item)}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{item.image || '🍽️'}</div>
                  <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                  <p className="text-xl font-bold text-blue-600">${parseFloat(item.price).toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panel de Carrito - Derecha */}
        <div className="w-1/3 bg-white shadow-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ShoppingCart className="mr-2 text-green-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Carrito</h2>
            </div>
            {orderType === 'dine-in' && selectedTable && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                Mesa {selectedTable.number}
              </span>
            )}
            {orderType === 'delivery' && selectedCustomer && (
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                {selectedCustomer.name}
              </span>
            )}
            {orderType === 'takeaway' && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                Para llevar
              </span>
            )}
          </div>

          {!getCartKey() ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                <p>
                  {orderType === 'dine-in' && 'Selecciona una mesa para comenzar'}
                  {orderType === 'delivery' && 'Selecciona un cliente para comenzar'}
                  {orderType === 'takeaway' && 'Agrega productos del menú'}
                </p>
              </div>
            </div>
          ) : getCurrentCart(getCartKey()).length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>Carrito vacío</p>
                <p className="text-sm">Agrega productos del menú</p>
              </div>
            </div>
          ) : (
            <>
              {/* Items del carrito */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {getCurrentCart(getCartKey()).map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-600">${parseFloat(item.price).toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Información del cliente para delivery */}
              {orderType === 'delivery' && selectedCustomer && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center mb-2">
                    <MapPin className="mr-2 text-orange-600" size={16} />
                    <span className="font-semibold text-gray-800">Dirección de entrega:</span>
                  </div>
                  <p className="text-sm text-gray-700">{selectedCustomer.address1}</p>
                  {selectedCustomer.address2 && (
                    <p className="text-sm text-gray-700">{selectedCustomer.address2}</p>
                  )}
                  <p className="text-sm text-gray-700">{selectedCustomer.city}</p>
                  <p className="text-sm text-gray-600 mt-1">Tel: {selectedCustomer.phone}</p>
                </div>
              )}

              {/* Total y acciones */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Procesar Pago
                  </button>
                  <button
                    onClick={handleClearCart}
                    className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Limpiar Carrito
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Cliente Nuevo */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nuevo Cliente</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="3331234567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Juan Pérez"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección 1 *</label>
                <input
                  type="text"
                  value={newCustomer.address1}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address1: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Av. Principal 123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección 2</label>
                <input
                  type="text"
                  value={newCustomer.address2}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address2: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Col. Centro, Int. 5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ciudad Guzmán"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createCustomer}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Procesar Pago</h3>
              <button 
                onClick={() => setShowPayment(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Método de pago:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cash', label: 'Efectivo' },
                    { value: 'card', label: 'Tarjeta' },
                    { value: 'transfer', label: 'Transferencia' },
                    { value: 'mixed', label: 'Mixto' }
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`p-3 rounded-lg border transition-colors ${
                        paymentMethod === method.value
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={processSale}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Procesar Pago
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedPOSView;