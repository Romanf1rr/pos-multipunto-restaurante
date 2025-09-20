// frontend/src/components/TablesView.js
import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, MapPin, CheckCircle, AlertCircle, 
  XCircle, Utensils, Plus, Trash2, Edit3 
} from 'lucide-react';

const TablesView = ({ apiService, user }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const tablesData = await apiService.getTables();
      setTables(tablesData);
    } catch (error) {
      setError('Error cargando mesas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTableStatus = async (tableId, newStatus) => {
    try {
      await apiService.updateTableStatus(tableId, newStatus);
      setTables(tables.map(table => 
        table.id === tableId ? { ...table, status: newStatus } : table
      ));
    } catch (error) {
      setError('Error actualizando mesa: ' + error.message);
    }
  };

  // Componente de mesa individual con diseño visual
  const TableCard = ({ table }) => {
    const getTableStyle = () => {
      const baseStyle = "relative p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:scale-105";
      
      switch (table.status) {
        case 'available':
          return `${baseStyle} bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 hover:from-green-200 hover:to-green-300`;
        case 'occupied':
          return `${baseStyle} bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300 hover:from-red-200 hover:to-red-300`;
        case 'reserved':
          return `${baseStyle} bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-300 hover:from-yellow-200 hover:to-yellow-300`;
        case 'cleaning':
          return `${baseStyle} bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 hover:from-blue-200 hover:to-blue-300`;
        default:
          return `${baseStyle} bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300`;
      }
    };

    const getStatusIcon = () => {
      switch (table.status) {
        case 'available':
          return <CheckCircle className="w-6 h-6 text-green-600" />;
        case 'occupied':
          return <Users className="w-6 h-6 text-red-600" />;
        case 'reserved':
          return <Clock className="w-6 h-6 text-yellow-600" />;
        case 'cleaning':
          return <AlertCircle className="w-6 h-6 text-blue-600" />;
        default:
          return <XCircle className="w-6 h-6 text-gray-600" />;
      }
    };

    const getStatusText = () => {
      switch (table.status) {
        case 'available':
          return 'Disponible';
        case 'occupied':
          return 'Ocupada';
        case 'reserved':
          return 'Reservada';
        case 'cleaning':
          return 'Limpieza';
        default:
          return 'Inactiva';
      }
    };

    const getStatusColor = () => {
      switch (table.status) {
        case 'available':
          return 'text-green-700';
        case 'occupied':
          return 'text-red-700';
        case 'reserved':
          return 'text-yellow-700';
        case 'cleaning':
          return 'text-blue-700';
        default:
          return 'text-gray-700';
      }
    };

    return (
      <div 
        className={getTableStyle()}
        onClick={() => setSelectedTable(table)}
      >
        {/* Indicador de estado en la esquina */}
        <div className="absolute top-3 right-3">
          {getStatusIcon()}
        </div>

        {/* Representación visual de la mesa */}
        <div className="flex flex-col items-center mb-4">
          {/* Mesa circular o rectangular según capacidad */}
          <div className={`
            ${table.capacity <= 2 ? 'w-16 h-16 rounded-full' : 
              table.capacity <= 4 ? 'w-20 h-16 rounded-xl' : 
              'w-24 h-20 rounded-xl'} 
            bg-white shadow-inner border-4 border-gray-300 flex items-center justify-center mb-2
          `}>
            <Utensils className="w-6 h-6 text-gray-500" />
          </div>
          
          {/* Sillas alrededor de la mesa */}
          <div className="flex justify-center space-x-1">
            {Array.from({ length: table.capacity }, (_, i) => (
              <div 
                key={i} 
                className="w-3 h-3 bg-gray-400 rounded-full"
                title={`Silla ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Información de la mesa */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            Mesa {table.number}
          </h3>
          <p className={`text-sm font-semibold mb-2 ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>{table.capacity} personas</span>
            </div>
            {table.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{table.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional si está ocupada */}
        {table.status === 'occupied' && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded text-center">
              En uso
            </div>
          </div>
        )}
      </div>
    );
  };

  // Modal para gestionar mesa
  const TableModal = () => {
    if (!selectedTable) return null;

    const statusOptions = [
      { value: 'available', label: 'Disponible', color: 'green' },
      { value: 'occupied', label: 'Ocupada', color: 'red' },
      { value: 'reserved', label: 'Reservada', color: 'yellow' },
      { value: 'cleaning', label: 'Limpieza', color: 'blue' }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Gestionar Mesa {selectedTable.number}</h3>
            <button 
              onClick={() => setSelectedTable(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                Mesa {selectedTable.number}
              </div>
              <div className="text-sm text-gray-600">
                Capacidad: {selectedTable.capacity} personas
              </div>
              {selectedTable.location && (
                <div className="text-sm text-gray-600">
                  Ubicación: {selectedTable.location}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Cambiar estado:</label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      updateTableStatus(selectedTable.id, option.value);
                      setSelectedTable(null);
                    }}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedTable.status === option.value
                        ? `bg-${option.color}-100 border-${option.color}-300 text-${option.color}-700`
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedTable.status === 'available' && (
              <button
                onClick={() => {
                  // Aquí iría la lógica para tomar la orden
                  console.log('Tomar orden para mesa', selectedTable.number);
                  setSelectedTable(null);
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tomar Orden
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Mesas</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {tables.filter(t => t.status === 'available').length} disponibles • 
            {tables.filter(t => t.status === 'occupied').length} ocupadas
          </div>
          {user.role === 'admin' && (
            <button
              onClick={() => setShowTableModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Mesa
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Leyenda de estados */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h3 className="text-sm font-semibold mb-3 text-gray-700">Estados de las mesas:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-300 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-300 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Ocupada</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-300 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Reservada</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-300 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Limpieza</span>
          </div>
        </div>
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {tables.map((table) => (
          <TableCard key={table.id} table={table} />
        ))}
      </div>

      {/* Modal de gestión de mesa */}
      {selectedTable && <TableModal />}
    </div>
  );
};

export default TablesView; 
