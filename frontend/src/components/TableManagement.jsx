// components/TableManagement.jsx
import React, { useState } from 'react';
import { Plus, Users, Clock, CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { usePersistentTables } from '../hooks/usePersistentTables';

const TableManagement = ({ onSelectTable }) => {
  const {
    mesas,
    loading,
    error,
    agregarMesa,
    cambiarEstadoMesa,
    eliminarMesa,
    resetearMesas,
    obtenerEstadisticasMesas
  } = usePersistentTables();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [numeroNuevaMesa, setNumeroNuevaMesa] = useState('');
  const [capacidadNuevaMesa, setCapacidadNuevaMesa] = useState(4);
  const [procesando, setProcesando] = useState(false);

  const estadisticas = obtenerEstadisticasMesas();

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'disponible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reservada':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactiva':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'disponible':
        return <CheckCircle className="w-4 h-4" />;
      case 'ocupada':
        return <Users className="w-4 h-4" />;
      case 'reservada':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleCrearMesa = async (e) => {
    e.preventDefault();
    if (!numeroNuevaMesa || numeroNuevaMesa <= 0) {
      alert('Por favor ingresa un número de mesa válido');
      return;
    }

    setProcesando(true);
    const resultado = await agregarMesa(parseInt(numeroNuevaMesa), capacidadNuevaMesa);
    
    if (resultado.success) {
      setNumeroNuevaMesa('');
      setCapacidadNuevaMesa(4);
      setMostrarFormulario(false);
      alert(resultado.message);
    } else {
      alert(`Error: ${resultado.message}`);
    }
    setProcesando(false);
  };

  const handleCambiarEstado = async (mesaId, estadoActual) => {
    const nuevosEstados = {
      'disponible': 'ocupada',
      'ocupada': 'disponible',
      'reservada': 'disponible'
    };

    const nuevoEstado = nuevosEstados[estadoActual] || 'disponible';
    
    setProcesando(true);
    const resultado = await cambiarEstadoMesa(mesaId, nuevoEstado);
    
    if (!resultado.success) {
      alert(`Error: ${resultado.message}`);
    }
    setProcesando(false);
  };

  const handleEliminarMesa = async (mesaId, numeroMesa) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la Mesa ${numeroMesa}?`)) {
      setProcesando(true);
      const resultado = await eliminarMesa(mesaId);
      
      if (resultado.success) {
        alert(resultado.message);
      } else {
        alert(`Error: ${resultado.message}`);
      }
      setProcesando(false);
    }
  };

  const handleResetearMesas = async () => {
    if (window.confirm('¿Estás seguro de que quieres liberar todas las mesas?')) {
      setProcesando(true);
      const resultado = await resetearMesas();
      
      if (resultado.success) {
        alert(resultado.message);
      } else {
        alert(`Error: ${resultado.message}`);
      }
      setProcesando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Cargando mesas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mesas</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{estadisticas.disponibles}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ocupadas</p>
              <p className="text-2xl font-bold text-red-600">{estadisticas.ocupadas}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ocupación</p>
              <p className="text-2xl font-bold text-blue-600">{estadisticas.porcentajeOcupacion}%</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          disabled={procesando}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Mesa</span>
        </button>

        <button
          onClick={handleResetearMesas}
          disabled={procesando}
          className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Liberar Todas</span>
        </button>
      </div>

      {/* Formulario nueva mesa */}
      {mostrarFormulario && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Crear Nueva Mesa</h3>
          <form onSubmit={handleCrearMesa} className="flex flex-wrap gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Mesa
              </label>
              <input
                type="number"
                min="1"
                value={numeroNuevaMesa}
                onChange={(e) => setNumeroNuevaMesa(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacidad
              </label>
              <select
                value={capacidadNuevaMesa}
                onChange={(e) => setCapacidadNuevaMesa(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>2 personas</option>
                <option value={4}>4 personas</option>
                <option value={6}>6 personas</option>
                <option value={8}>8 personas</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="submit"
                disabled={procesando}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {procesando ? 'Creando...' : 'Crear Mesa'}
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de mesas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {mesas.map((mesa) => (
          <div
            key={mesa.id}
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${getEstadoColor(mesa.estado)}`}
            onClick={() => mesa.estado === 'disponible' && onSelectTable && onSelectTable(mesa)}
          >
            {/* Botón eliminar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEliminarMesa(mesa.id, mesa.numero);
              }}
              className="absolute top-1 right-1 text-red-500 hover:text-red-700 p-1"
              disabled={procesando}
            >
              <Trash2 className="w-3 h-3" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getEstadoIcon(mesa.estado)}
              </div>
              
              <h3 className="text-lg font-bold">Mesa {mesa.numero}</h3>
              <p className="text-sm opacity-75">{mesa.capacidad} personas</p>
              
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(mesa.estado)}`}>
                  {mesa.estado.charAt(0).toUpperCase() + mesa.estado.slice(1)}
                </span>
              </div>

              {/* Botón cambiar estado */}
              {mesa.estado !== 'inactiva' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCambiarEstado(mesa.id, mesa.estado);
                  }}
                  disabled={procesando}
                  className="mt-2 text-xs bg-white bg-opacity-50 hover:bg-opacity-75 px-2 py-1 rounded border transition-colors"
                >
                  {mesa.estado === 'disponible' ? 'Ocupar' : 'Liberar'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {mesas.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No hay mesas configuradas</h3>
          <p className="text-gray-400 mb-4">Crea tu primera mesa para comenzar</p>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Crear Primera Mesa
          </button>
        </div>
      )}
    </div>
  );
};

export default TableManagement;