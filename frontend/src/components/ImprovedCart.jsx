// components/ImprovedCart.jsx - Versión con items más compactos
import React, { useState, useEffect } from 'react';
import { Minus, Plus, X, ShoppingCart, CreditCard, Trash2, Percent } from 'lucide-react';
import dataPersistence from '../services/DataPersistence';

const ImprovedCart = ({ 
  cartItems = [], 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  onProcessPayment,
  mesaId = null 
}) => {
  const [descuento, setDescuento] = useState(0);
  const [tipoDescuento, setTipoDescuento] = useState('porcentaje');
  const [mostrarDescuento, setMostrarDescuento] = useState(false);

  // Calcular subtotal
  const subtotal = cartItems.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  
  // Calcular descuento aplicado
  const montoDescuento = tipoDescuento === 'porcentaje' 
    ? (subtotal * descuento) / 100 
    : descuento;
    
  // Total final (sin IVA)
  const total = Math.max(0, subtotal - montoDescuento);

  // Guardar carrito en persistencia cada vez que cambie
  useEffect(() => {
    if (mesaId && cartItems.length > 0) {
      dataPersistence.guardarCarrito(mesaId, cartItems);
    }
  }, [cartItems, mesaId]);

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const handleAplicarDescuento = () => {
    if (descuento < 0) setDescuento(0);
    if (tipoDescuento === 'porcentaje' && descuento > 100) setDescuento(100);
    if (tipoDescuento === 'fijo' && descuento > subtotal) setDescuento(subtotal);
    setMostrarDescuento(false);
  };

  const handleQuitarDescuento = () => {
    setDescuento(0);
    setMostrarDescuento(false);
  };

  const handleProcessPayment = async () => {
    try {
      const folio = await dataPersistence.obtenerSiguienteFolio();
      
      const venta = {
        folio: folio,
        mesa_id: mesaId,
        productos: cartItems,
        subtotal: subtotal,
        descuento: montoDescuento,
        tipo_descuento: tipoDescuento,
        total: total,
        fecha: new Date().toISOString()
      };

      await dataPersistence.guardarVenta(venta);
      
      // Limpiar carrito después del pago
      await dataPersistence.limpiarCarritoMesa(mesaId);
      onProcessPayment(venta);
      
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Error al procesar el pago. Intenta nuevamente.');
    }
  };

  const handleClearCart = async () => {
    if (mesaId) {
      await dataPersistence.limpiarCarritoMesa(mesaId);
    }
    onClearCart();
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-blue rounded-lg shadow-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-500 mb-2">Carrito Vacío</h3>
        <p className="text-gray-400 text-center">
          Agrega productos al carrito para comenzar una venta
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      {/* Header del carrito */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 text-blue-600" />
          <h3 className="text-md font-semibold text-gray-800">
            Carrito ({cartItems.length})
          </h3>
        </div>
        <button
          onClick={handleClearCart}
          className="text-red-500 hover:text-red-700 p-1"
          title="Limpiar carrito"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Lista de productos con scroll - MÁS COMPACTA */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        <div className="space-y-1">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 rounded-md p-2 flex items-center justify-between text-xs"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800 text-xs leading-tight truncate">
                  {item.nombre}
                </h4>
                <p className="text-blue-600 font-semibold text-xs">
                  ${item.precio.toFixed(2)}
                </p>
              </div>
              
              <div className="flex items-center space-x-1 ml-2">
                {/* Controles de cantidad más pequeños */}
                <div className="flex items-center bg-white rounded border">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                    className="p-1 hover:bg-gray-100 rounded-l"
                  >
                    <Minus className="w-2 h-2" />
                  </button>
                  <span className="px-1 py-1 text-xs font-medium min-w-[20px] text-center">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                    className="p-1 hover:bg-gray-100 rounded-r"
                  >
                    <Plus className="w-2 h-2" />
                  </button>
                </div>

                {/* Subtotal del item */}
                <div className="text-right min-w-[35px]">
                  <p className="font-semibold text-gray-800 text-xs">
                    ${(item.precio * item.cantidad).toFixed(2)}
                  </p>
                </div>

                {/* Botón eliminar */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección de descuentos */}
      <div className="p-3 border-t border-gray-200">
        {!mostrarDescuento && descuento === 0 && (
          <button
            onClick={() => setMostrarDescuento(true)}
            className="w-full flex items-center justify-center space-x-2 text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors"
          >
            <Percent className="w-3 h-3" />
            <span className="text-xs font-medium">Aplicar Descuento</span>
          </button>
        )}

        {mostrarDescuento && (
          <div className="space-y-2 p-2 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 text-sm">Configurar Descuento</h4>
            
            <div className="flex space-x-1">
              <button
                onClick={() => setTipoDescuento('porcentaje')}
                className={`px-2 py-1 rounded text-xs ${
                  tipoDescuento === 'porcentaje'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-green-600 border'
                }`}
              >
                %
              </button>
              <button
                onClick={() => setTipoDescuento('fijo')}
                className={`px-2 py-1 rounded text-xs ${
                  tipoDescuento === 'fijo'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-green-600 border'
                }`}
              >
                $
              </button>
            </div>

            <div className="flex space-x-1">
              <input
                type="number"
                min="0"
                max={tipoDescuento === 'porcentaje' ? 100 : subtotal}
                value={descuento}
                onChange={(e) => setDescuento(Number(e.target.value))}
                className="flex-1 px-2 py-1 border rounded text-xs"
                placeholder={tipoDescuento === 'porcentaje' ? '0-100' : '0.00'}
                step={tipoDescuento === 'porcentaje' ? 1 : 0.01}
              />
              <button
                onClick={handleAplicarDescuento}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
              >
                Aplicar
              </button>
              <button
                onClick={() => setMostrarDescuento(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {descuento > 0 && !mostrarDescuento && (
          <div className="flex items-center justify-between p-2 bg-green-100 rounded-lg">
            <span className="text-green-800 text-xs">
              Descuento {tipoDescuento === 'porcentaje' ? `${descuento}%` : `$${descuento.toFixed(2)}`}
            </span>
            <button
              onClick={handleQuitarDescuento}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          {descuento > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>Descuento:</span>
              <span>-${montoDescuento.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200">
            <span>Total:</span>
            <span className="text-blue-600">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Botones de acción - Siempre visibles y más compactos */}
      <div className="p-3 bg-gray-50 rounded-b-lg space-y-2">
        <button
          onClick={handleProcessPayment}
          disabled={cartItems.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm"
        >
          <CreditCard className="w-4 h-4" />
          <span>Procesar Pago - ${total.toFixed(2)}</span>
        </button>
        
        <button
          onClick={handleClearCart}
          disabled={cartItems.length === 0}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium py-1 px-3 rounded-lg transition-colors text-sm"
        >
          Limpiar Carrito
        </button>
      </div>
    </div>
  );
};

export default ImprovedCart;