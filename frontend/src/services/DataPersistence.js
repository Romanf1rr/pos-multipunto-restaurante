// services/DataPersistence.js
// Servicio para manejar la persistencia de datos en IndexedDB

class DataPersistenceService {
  constructor() {
    this.dbName = 'RestaurantPOS_DB';
    this.version = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Crear tabla de mesas
        if (!db.objectStoreNames.contains('mesas')) {
          const mesasStore = db.createObjectStore('mesas', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          mesasStore.createIndex('numero', 'numero', { unique: true });
          mesasStore.createIndex('estado', 'estado', { unique: false });
        }

        // Crear tabla de folios
        if (!db.objectStoreNames.contains('folios')) {
          const foliosStore = db.createObjectStore('folios', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          foliosStore.createIndex('numero', 'numero', { unique: true });
        }

        // Crear tabla de ventas
        if (!db.objectStoreNames.contains('ventas')) {
          const ventasStore = db.createObjectStore('ventas', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          ventasStore.createIndex('fecha', 'fecha', { unique: false });
          ventasStore.createIndex('mesa_id', 'mesa_id', { unique: false });
        }

        // Crear tabla de productos en carrito
        if (!db.objectStoreNames.contains('carrito')) {
          const carritoStore = db.createObjectStore('carrito', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          carritoStore.createIndex('mesa_id', 'mesa_id', { unique: false });
        }

        // Crear configuraciones del sistema
        if (!db.objectStoreNames.contains('configuracion')) {
          const configStore = db.createObjectStore('configuracion', { 
            keyPath: 'clave' 
          });
        }
      };
    });
  }

  // Métodos para mesas
  async crearMesa(numero, capacidad = 4) {
    const transaction = this.db.transaction(['mesas'], 'readwrite');
    const store = transaction.objectStore('mesas');
    
    const mesa = {
      numero: numero,
      capacidad: capacidad,
      estado: 'disponible', // disponible, ocupada, reservada
      fecha_creacion: new Date().toISOString(),
      ultima_actualizacion: new Date().toISOString()
    };

    return store.add(mesa);
  }

  async obtenerMesas() {
    const transaction = this.db.transaction(['mesas'], 'readonly');
    const store = transaction.objectStore('mesas');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async actualizarEstadoMesa(mesaId, nuevoEstado) {
    const transaction = this.db.transaction(['mesas'], 'readwrite');
    const store = transaction.objectStore('mesas');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(mesaId);
      getRequest.onsuccess = () => {
        const mesa = getRequest.result;
        if (mesa) {
          mesa.estado = nuevoEstado;
          mesa.ultima_actualizacion = new Date().toISOString();
          const updateRequest = store.put(mesa);
          updateRequest.onsuccess = () => resolve(updateRequest.result);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Mesa no encontrada'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Métodos para folios
  async obtenerSiguienteFolio() {
    const transaction = this.db.transaction(['configuracion'], 'readwrite');
    const store = transaction.objectStore('configuracion');
    
    return new Promise((resolve, reject) => {
      const request = store.get('ultimo_folio');
      request.onsuccess = () => {
        let ultimoFolio = request.result ? request.result.valor : 0;
        ultimoFolio++;
        
        // Actualizar el último folio usado
        const updateRequest = store.put({
          clave: 'ultimo_folio',
          valor: ultimoFolio,
          fecha_actualizacion: new Date().toISOString()
        });
        
        updateRequest.onsuccess = () => resolve(ultimoFolio);
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async guardarVenta(venta) {
    const transaction = this.db.transaction(['ventas'], 'readwrite');
    const store = transaction.objectStore('ventas');
    
    venta.fecha = new Date().toISOString();
    return store.add(venta);
  }

  // Métodos para carrito
  async guardarCarrito(mesaId, productos) {
    const transaction = this.db.transaction(['carrito'], 'readwrite');
    const store = transaction.objectStore('carrito');

    // Primero eliminar carrito existente para esta mesa
    await this.limpiarCarritoMesa(mesaId);

    // Guardar cada producto del carrito
    const promises = productos.map(producto => {
      const item = {
        mesa_id: mesaId,
        producto: producto,
        fecha_agregado: new Date().toISOString()
      };
      return store.add(item);
    });

    return Promise.all(promises);
  }

  async obtenerCarrito(mesaId) {
    const transaction = this.db.transaction(['carrito'], 'readonly');
    const store = transaction.objectStore('carrito');
    const index = store.index('mesa_id');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(mesaId);
      request.onsuccess = () => {
        const productos = request.result.map(item => item.producto);
        resolve(productos);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async limpiarCarritoMesa(mesaId) {
    const transaction = this.db.transaction(['carrito'], 'readwrite');
    const store = transaction.objectStore('carrito');
    const index = store.index('mesa_id');
    
    return new Promise((resolve, reject) => {
      const request = index.getAllKeys(mesaId);
      request.onsuccess = () => {
        const keys = request.result;
        const deletePromises = keys.map(key => store.delete(key));
        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Método para resetear datos (útil para desarrollo)
  async resetearBaseDatos() {
    const transaction = this.db.transaction(['mesas', 'folios', 'ventas', 'carrito', 'configuracion'], 'readwrite');
    
    const stores = ['mesas', 'folios', 'ventas', 'carrito', 'configuracion'];
    const clearPromises = stores.map(storeName => {
      const store = transaction.objectStore(storeName);
      return store.clear();
    });

    return Promise.all(clearPromises);
  }

  // Método para exportar datos (backup)
  async exportarDatos() {
    const mesas = await this.obtenerMesas();
    const carrito = await this.obtenerTodoCarrito();
    
    return {
      mesas,
      carrito,
      fecha_exportacion: new Date().toISOString()
    };
  }

  async obtenerTodoCarrito() {
    const transaction = this.db.transaction(['carrito'], 'readonly');
    const store = transaction.objectStore('carrito');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Instancia singleton
const dataPersistence = new DataPersistenceService();

export default dataPersistence;