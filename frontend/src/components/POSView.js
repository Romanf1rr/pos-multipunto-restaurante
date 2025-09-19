// frontend/src/components/POSView.js
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Minus, Trash2, CreditCard, 
  Calculator, X, Check, AlertTriangle 
} from 'lucide-react';

const POSView = ({ apiService, user }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [categoriesData, menuData] = await Promise.all([
        apiService.getCategories(),
        apiService.getMenu()
      ]);
      
      setCategories(categoriesData);
      setMenuItems(menuData);
      
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (error) {
      setError('Error cargando datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar items por categoría
  const filteredItems = menuItems.filter(item => 
    !selectedCategory || item.categoryId === selectedCategory
  );

  // Funciones del carrito
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cálculos
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.16; // 16% IVA
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Procesar venta
  const processSale = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          notes: item.notes || ''
        })),
        tableId: selectedTable,
        paymentMethod,
        notes: `Venta procesada por ${user.name}`,
        deviceId: `device_${user.id}`
      };

      const result = await apiService.createSale(saleData);
      
      if (result.success) {
        // Limpiar carrito y cerrar modal de pago
        setCart([]);
        setShowPayment(false);
        setSelectedTable(null);
        setError('');
        
        // Mostrar confirmación
        alert(`Venta procesada exitosamente!\nTotal: $${total.toFixed(2)}\nFolio: ${result.sale.id}`);
      }
    } catch (error) {
      setError('Error procesando venta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Modal de pago
  const PaymentModal = () => (
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

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>IVA (16%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
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

          {selectedTable && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700 font-medium">Mesa: #{selectedTable}</span>
            </div>
          )}
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
  );

  if (loading && menuItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Panel del Menú */}
      <div className="flex-1 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Punto de Venta</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          {/* Selector de Mesa */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Mesa (opcional):</label>
            <select
              value={selectedTable || ''}
              onChange={(e) => setSelectedTable(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Para llevar</option>
              {Array.from({length: 12}, (_, i) => (
                <option key={i + 1} value={i + 1}>Mesa {i + 1}</option>
              ))}
            </select>
          </div>

          {/* Categorías */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items del Menú */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200 hover:scale-105 border border-gray-100"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{item.image || '🍽️'}</div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-lg font-bold text-green-600">
                    ${parseFloat(item.price).toFixed(2)}
                  </p>
                  {item.stock !== -1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Stock: {item.stock}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel del Carrito */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Orden Actual</h3>
            <ShoppingCart className="w-6 h-6 text-gray-600" />
          </div>
          {selectedTable && (
            <p className="text-sm text-blue-600 mt-1">Mesa #{selectedTable}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800 text-sm flex-1">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        ${parseFloat(item.price).toFixed(2)} c/u
                      </p>
                      <p className="font-bold text-green-600">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen y acciones */}
        {cart.length > 0 && (
          <div className="border-t p-6">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (16%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowPayment(true)}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Procesar Pago
              </button>
              
              <button
                onClick={clearCart}
                className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar Carrito
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de pago */}
      {showPayment && <PaymentModal />}
    </div>
  );
};

export default POSView; 
