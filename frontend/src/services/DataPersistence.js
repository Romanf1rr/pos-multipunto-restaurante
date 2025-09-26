// Servicio para manejar la persistencia de datos en IndexedDB

class DataPersistenceService {
  constructor() {
    this.dbName = 'RestaurantPOS_DB';
    this.version = 2; // Subir versión para stores nuevos
    this.db = null;
    this._initPromise = this.init();
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
          db.createObjectStore('configuracion', { keyPath: 'clave' });
        }

        // === NUEVO: Inventario
        if (!db.objectStoreNames.contains('inventario')) {
          const inventarioStore = db.createObjectStore('inventario', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          inventarioStore.createIndex('nombre', 'nombre', { unique: false });
          inventarioStore.createIndex('categoria', 'categoria', { unique: false });
        }

        // === NUEVO: Movimientos de Inventario
        if (!db.objectStoreNames.contains('movimientos_inventario')) {
          const movsStore = db.createObjectStore('movimientos_inventario', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          movsStore.createIndex('productoId', 'productoId', { unique: false });
          movsStore.createIndex('fecha', 'fecha', { unique: false });
        }
      };
    });
  }

  // Esperar a que la DB esté lista
  async ready() {
    if (this.db) return;
    await this._initPromise;
  }

  // Métodos para mesas (igual)
  async crearMesa(numero, capacidad = 4) { await this.ready(); /* ... */ }
  async obtenerMesas() { await this.ready(); /* ... */ }
  async actualizarEstadoMesa(mesaId, nuevoEstado) { await this.ready(); /* ... */ }

  // Métodos para folios (igual)
  async obtenerSiguienteFolio() { await this.ready(); /* ... */ }
  async guardarVenta(venta) { await this.ready(); /* ... */ }

  // Métodos para carrito (igual)
  async guardarCarrito(mesaId, productos) { await this.ready(); /* ... */ }
  async obtenerCarrito(mesaId) { await this.ready(); /* ... */ }
  async limpiarCarritoMesa(mesaId) { await this.ready(); /* ... */ }
  async obtenerTodoCarrito() { await this.ready(); /* ... */ }

  // Método para resetear datos (útil para desarrollo)
  async resetearBaseDatos() {
    await this.ready();
    const transaction = this.db.transaction(['mesas', 'folios', 'ventas', 'carrito', 'configuracion', 'inventario', 'movimientos_inventario'], 'readwrite');
    const stores = ['mesas', 'folios', 'ventas', 'carrito', 'configuracion', 'inventario', 'movimientos_inventario'];
    const clearPromises = stores.map(storeName => {
      const store = transaction.objectStore(storeName);
      return store.clear();
    });
    return Promise.all(clearPromises);
  }

  // Método para exportar datos (backup)
  async exportarDatos() {
    await this.ready();
    const mesas = await this.obtenerMesas();
    const carrito = await this.obtenerTodoCarrito();
    const inventario = await this.obtenerProductosInventario();
    const movimientosInventario = await this.obtenerMovimientosInventario();
    return {
      mesas,
      carrito,
      inventario,
      movimientosInventario,
      fecha_exportacion: new Date().toISOString()
    };
  }

  // =========================
  // ==== INVENTARIO =========
  // =========================

  async crearProductoInventario(producto) {
    await this.ready();
    const transaction = this.db.transaction(['inventario'], 'readwrite');
    const store = transaction.objectStore('inventario');
    const prodData = {
      ...producto,
      fecha_creacion: new Date().toISOString(),
      ultima_actualizacion: new Date().toISOString()
    };
    return new Promise((resolve, reject) => {
      const req = store.add(prodData);
      req.onsuccess = () => resolve({ ...prodData, id: req.result });
      req.onerror = () => reject(req.error);
    });
  }

  async actualizarProductoInventario(id, data) {
    await this.ready();
    const transaction = this.db.transaction(['inventario'], 'readwrite');
    const store = transaction.objectStore('inventario');
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const producto = getReq.result;
        if (producto) {
          const actualizado = { ...producto, ...data, ultima_actualizacion: new Date().toISOString() };
          const putReq = store.put(actualizado);
          putReq.onsuccess = () => resolve(actualizado);
          putReq.onerror = () => reject(putReq.error);
        } else {
          reject(new Error('Producto no encontrado'));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async eliminarProductoInventario(id) {
    await this.ready();
    const transaction = this.db.transaction(['inventario'], 'readwrite');
    const store = transaction.objectStore('inventario');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async obtenerProductosInventario() {
    await this.ready();
    const transaction = this.db.transaction(['inventario'], 'readonly');
    const store = transaction.objectStore('inventario');
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // =========================
  // == MOVIMIENTOS INVENTARIO
  // =========================

  async registrarMovimientoInventario(movimiento) {
    await this.ready();
    const transaction = this.db.transaction(['movimientos_inventario', 'inventario'], 'readwrite');
    const movStore = transaction.objectStore('movimientos_inventario');
    const invStore = transaction.objectStore('inventario');

    return new Promise((resolve, reject) => {
      // Actualiza el producto
      const getReq = invStore.get(movimiento.productoId);
      getReq.onsuccess = () => {
        const producto = getReq.result;
        if (!producto) {
          return reject(new Error('Producto no encontrado'));
        }
        // Aplica el movimiento
        let nuevaCantidad = producto.cantidad || 0;
        if (movimiento.tipo === 'entrada') {
          nuevaCantidad += movimiento.cantidad;
        } else if (movimiento.tipo === 'salida') {
          if (nuevaCantidad < movimiento.cantidad) {
            return reject(new Error('Stock insuficiente'));
          }
          nuevaCantidad -= movimiento.cantidad;
        } else if (movimiento.tipo === 'ajuste') {
          nuevaCantidad = movimiento.cantidad;
        }
        producto.cantidad = nuevaCantidad;
        producto.ultima_actualizacion = new Date().toISOString();

        const putReq = invStore.put(producto);
        putReq.onsuccess = () => {
          // Registra el movimiento
          const movData = {
            ...movimiento,
            fecha: new Date().toISOString()
          };
          const addReq = movStore.add(movData);
          addReq.onsuccess = () => resolve(movData);
          addReq.onerror = () => reject(addReq.error);
        };
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async obtenerMovimientosInventario(productoId = null) {
    await this.ready();
    const transaction = this.db.transaction(['movimientos_inventario'], 'readonly');
    const store = transaction.objectStore('movimientos_inventario');
    return new Promise((resolve, reject) => {
      if (productoId) {
        const index = store.index('productoId');
        const req = index.getAll(productoId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } else {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }
    });
  }

  async obtenerProductosStockBajo() {
    const productos = await this.obtenerProductosInventario();
    return productos.filter(p => Number(p.cantidad) <= Number(p.cantidadMinima || 0));
  }
}

// Instancia singleton
const dataPersistence = new DataPersistenceService();
export default dataPersistence;