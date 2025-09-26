import dataPersistence from './DataPersistence';

// Obtener todos los productos de inventario
export async function getProductos() {
  return await dataPersistence.obtenerProductosInventario();
}

// Crear producto nuevo
export async function crearProducto(productoData) {
  return await dataPersistence.crearProductoInventario(productoData);
}

// Actualizar un producto existente
export async function actualizarProducto(id, data) {
  return await dataPersistence.actualizarProductoInventario(id, data);
}

// Eliminar un producto
export async function eliminarProducto(id) {
  return await dataPersistence.eliminarProductoInventario(id);
}

// Registrar movimiento (entrada, salida, ajuste)
export async function registrarMovimiento(movimientoData) {
  return await dataPersistence.registrarMovimientoInventario(movimientoData);
}

// Obtener movimientos de un producto (o todos)
export async function getMovimientos(productoId = null) {
  return await dataPersistence.obtenerMovimientosInventario(productoId);
}

// Productos con bajo stock
export async function getAlertasStockBajo() {
  return await dataPersistence.obtenerProductosStockBajo();
}

export default {
  getProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  registrarMovimiento,
  getMovimientos,
  getAlertasStockBajo
};