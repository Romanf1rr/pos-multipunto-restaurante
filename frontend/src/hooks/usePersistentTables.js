// hooks/usePersistentTables.js
import { useState, useEffect } from 'react';
import dataPersistence from '../services/DataPersistence';

export const usePersistentTables = () => {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar mesas al inicializar
  useEffect(() => {
    cargarMesas();
  }, []);

  const cargarMesas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Esperar a que la base de datos esté inicializada
      await dataPersistence.init();
      
      const mesasGuardadas = await dataPersistence.obtenerMesas();
      
      // Si no hay mesas guardadas, crear algunas por defecto
      if (mesasGuardadas.length === 0) {
        await inicializarMesasDefault();
        const mesasDefault = await dataPersistence.obtenerMesas();
        setMesas(mesasDefault);
      } else {
        setMesas(mesasGuardadas);
      }
      
    } catch (err) {
      console.error('Error al cargar mesas:', err);
      setError('Error al cargar las mesas');
      // En caso de error, crear mesas en memoria temporal
      setMesas(crearMesasTemporales());
    } finally {
      setLoading(false);
    }
  };

  const inicializarMesasDefault = async () => {
    const mesasDefault = [
      { numero: 1, capacidad: 2 },
      { numero: 2, capacidad: 4 },
      { numero: 3, capacidad: 4 },
      { numero: 4, capacidad: 6 },
      { numero: 5, capacidad: 2 },
      { numero: 6, capacidad: 4 }
    ];

    for (const mesa of mesasDefault) {
      try {
        await dataPersistence.crearMesa(mesa.numero, mesa.capacidad);
      } catch (err) {
        console.warn(`Mesa ${mesa.numero} ya existe o error al crearla:`, err);
      }
    }
  };

  const crearMesasTemporales = () => {
    return [
      { id: 1, numero: 1, capacidad: 2, estado: 'disponible' },
      { id: 2, numero: 2, capacidad: 4, estado: 'disponible' },
      { id: 3, numero: 3, capacidad: 4, estado: 'disponible' },
      { id: 4, numero: 4, capacidad: 6, estado: 'disponible' },
      { id: 5, numero: 5, capacidad: 2, estado: 'disponible' },
      { id: 6, numero: 6, capacidad: 4, estado: 'disponible' }
    ];
  };

  const agregarMesa = async (numeroMesa, capacidad = 4) => {
    try {
      // Verificar que el número no esté en uso
      const mesaExistente = mesas.find(m => m.numero === numeroMesa);
      if (mesaExistente) {
        throw new Error(`Ya existe una mesa con el número ${numeroMesa}`);
      }

      await dataPersistence.crearMesa(numeroMesa, capacidad);
      await cargarMesas(); // Recargar la lista
      
      return { success: true, message: `Mesa ${numeroMesa} creada exitosamente` };
      
    } catch (err) {
      console.error('Error al crear mesa:', err);
      return { success: false, message: err.message };
    }
  };

  const cambiarEstadoMesa = async (mesaId, nuevoEstado) => {
    try {
      await dataPersistence.actualizarEstadoMesa(mesaId, nuevoEstado);
      
      // Actualizar el estado local
      setMesas(prevMesas => 
        prevMesas.map(mesa => 
          mesa.id === mesaId 
            ? { ...mesa, estado: nuevoEstado, ultima_actualizacion: new Date().toISOString() }
            : mesa
        )
      );
      
      return { success: true };
      
    } catch (err) {
      console.error('Error al cambiar estado de mesa:', err);
      return { success: false, message: err.message };
    }
  };

  const obtenerMesaPorId = (mesaId) => {
    return mesas.find(mesa => mesa.id === mesaId);
  };

  const obtenerMesasDisponibles = () => {
    return mesas.filter(mesa => mesa.estado === 'disponible');
  };

  const obtenerMesasOcupadas = () => {
    return mesas.filter(mesa => mesa.estado === 'ocupada');
  };

  const resetearMesas = async () => {
    try {
      // Cambiar todas las mesas a disponible
      const promises = mesas.map(mesa => 
        dataPersistence.actualizarEstadoMesa(mesa.id, 'disponible')
      );
      
      await Promise.all(promises);
      await cargarMesas();
      
      return { success: true, message: 'Todas las mesas han sido liberadas' };
      
    } catch (err) {
      console.error('Error al resetear mesas:', err);
      return { success: false, message: err.message };
    }
  };

  const eliminarMesa = async (mesaId) => {
    try {
      // Por seguridad, no eliminar físicamente de la BD, solo cambiar estado
      await cambiarEstadoMesa(mesaId, 'inactiva');
      
      // Remover de la lista local
      setMesas(prevMesas => prevMesas.filter(mesa => mesa.id !== mesaId));
      
      return { success: true, message: 'Mesa eliminada exitosamente' };
      
    } catch (err) {
      console.error('Error al eliminar mesa:', err);
      return { success: false, message: err.message };
    }
  };

  const obtenerEstadisticasMesas = () => {
    const total = mesas.length;
    const disponibles = mesas.filter(m => m.estado === 'disponible').length;
    const ocupadas = mesas.filter(m => m.estado === 'ocupada').length;
    const reservadas = mesas.filter(m => m.estado === 'reservada').length;
    
    return {
      total,
      disponibles,
      ocupadas,
      reservadas,
      porcentajeOcupacion: total > 0 ? Math.round((ocupadas / total) * 100) : 0
    };
  };

  const exportarDatosMesas = async () => {
    try {
      const datos = await dataPersistence.exportarDatos();
      return { success: true, datos };
    } catch (err) {
      console.error('Error al exportar datos:', err);
      return { success: false, message: err.message };
    }
  };

  return {
    // Estados
    mesas,
    loading,
    error,
    
    // Métodos principales
    cargarMesas,
    agregarMesa,
    cambiarEstadoMesa,
    eliminarMesa,
    resetearMesas,
    
    // Métodos de consulta
    obtenerMesaPorId,
    obtenerMesasDisponibles,
    obtenerMesasOcupadas,
    obtenerEstadisticasMesas,
    
    // Utilidades
    exportarDatosMesas
  };
};