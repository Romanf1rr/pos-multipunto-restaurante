import React, { useEffect, useState } from "react";
import inventarioService from "../../services/inventarioService";


// Componente para el formulario/modal de crear/editar producto
const ProductoForm = ({ open, onClose, onSave, initialData = {} }) => {
  const [nombre, setNombre] = useState(initialData.nombre || "");
  const [categoria, setCategoria] = useState(initialData.categoria || "");
  const [cantidad, setCantidad] = useState(initialData.cantidad || 0);
  const [unidad, setUnidad] = useState(initialData.unidad || "");
  const [cantidadMinima, setCantidadMinima] = useState(initialData.cantidadMinima || 0);

  useEffect(() => {
    setNombre(initialData.nombre || "");
    setCategoria(initialData.categoria || "");
    setCantidad(initialData.cantidad || 0);
    setUnidad(initialData.unidad || "");
    setCantidadMinima(initialData.cantidadMinima || 0);
  }, [initialData, open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...initialData,
      nombre,
      categoria,
      cantidad: Number(cantidad),
      unidad,
      cantidadMinima: Number(cantidadMinima),
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form className="bg-white p-6 rounded shadow-md w-96" onSubmit={handleSubmit}>
        <h3 className="text-lg font-bold mb-4">{initialData.id ? "Editar" : "Agregar"} Producto</h3>
        <div className="mb-2">
          <label className="block text-sm font-semibold">Nombre</label>
          <input className="border rounded w-full p-1" value={nombre} required onChange={e => setNombre(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-semibold">Categoría</label>
          <input className="border rounded w-full p-1" value={categoria} onChange={e => setCategoria(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-semibold">Cantidad</label>
          <input type="number" min="0" className="border rounded w-full p-1" value={cantidad} required onChange={e => setCantidad(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-semibold">Unidad</label>
          <input className="border rounded w-full p-1" value={unidad} onChange={e => setUnidad(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-semibold">Cantidad mínima</label>
          <input type="number" min="0" className="border rounded w-full p-1" value={cantidadMinima} onChange={e => setCantidadMinima(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={onClose}>Cancelar</button>
          <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">{initialData.id ? "Actualizar" : "Crear"}</button>
        </div>
      </form>
    </div>
  );
};

// Componente para operaciones de entrada/salida de inventario
const MovimientoForm = ({ open, onClose, onSave, producto }) => {
  const [tipo, setTipo] = useState("entrada");
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    setTipo("entrada");
    setCantidad(1);
  }, [producto, open]);

  if (!open || !producto) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      productoId: producto.id,
      tipo,
      cantidad: Number(cantidad)
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form className="bg-white p-6 rounded shadow-md w-96" onSubmit={handleSubmit}>
        <h3 className="text-lg font-bold mb-4">Movimiento de {producto.nombre}</h3>
        <div className="mb-2">
          <label className="block text-sm font-semibold">Tipo de movimiento</label>
          <select className="border rounded w-full p-1" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </div>
        <div className="mb-2">
          <label className="block text-sm font-semibold">Cantidad</label>
          <input type="number" min="1" className="border rounded w-full p-1" value={cantidad} required onChange={e => setCantidad(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={onClose}>Cancelar</button>
          <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">Registrar</button>
        </div>
      </form>
    </div>
  );
};



const IndicadorStockBajo = ({ cantidad, cantidadMinima }) => {
  if (Number(cantidad) <= Number(cantidadMinima || 0)) {
    return (
      <span className="ml-2 px-2 py-0.5 rounded bg-red-500/20 text-red-600 text-xs font-bold ring-2 ring-red-400 animate-pulse">
        Stock bajo
      </span>
    );
  }
  return null;
};

const CategoriaIcono = ({ categoria }) => {
  // Puedes personalizar estos íconos según la categoría
  if (/carne/i.test(categoria)) return <span className="text-2xl mr-2">🥩</span>;
  if (/refresco|bebida/i.test(categoria)) return <span className="text-2xl mr-2">🥤</span>;
  if (/verdura|vegetal/i.test(categoria)) return <span className="text-2xl mr-2">🥦</span>;
  return <span className="text-2xl mr-2">📦</span>;
};

const InventarioView = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showMovimiento, setShowMovimiento] = useState(false);
  const [productoMovimiento, setProductoMovimiento] = useState(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  async function fetchProductos() {
    setLoading(true);
    const data = await inventarioService.getProductos();
    setProductos(data);
    setLoading(false);
  }

  const handleCreate = () => {
    setEditData(null);
    setShowForm(true);
  };

  const handleEdit = (prod) => {
    setEditData(prod);
    setShowForm(true);
  };

  const handleDelete = async (prod) => {
    if (window.confirm(`¿Eliminar el producto "${prod.nombre}"?`)) {
      await inventarioService.eliminarProducto(prod.id);
      fetchProductos();
    }
  };

  const handleSave = async (data) => {
    if (data.id) {
      await inventarioService.actualizarProducto(data.id, data);
    } else {
      await inventarioService.crearProducto(data);
    }
    setShowForm(false);
    fetchProductos();
  };

  const handleMovimiento = (prod) => {
    setProductoMovimiento(prod);
    setShowMovimiento(true);
  };

  const handleRegistrarMovimiento = async (movData) => {
    await inventarioService.registrarMovimiento(movData);
    setShowMovimiento(false);
    setProductoMovimiento(null);
    fetchProductos();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span role="img" aria-label="box">📦</span>
        Gestión de Inventario
      </h2>
      <div className="mb-6 flex justify-end">
  <button 
    className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded font-bold flex items-center gap-2 shadow"
    onClick={handleCreate} // <-- Aquí va, ¡fuera del contenido!
  >
    <span className="text-lg">+</span> Agregar producto
  </button>
</div>
      {loading && <div>Cargando inventario...</div>}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
          {productos.map((prod) => (
            <div
              key={prod.id}
              className={`rounded-2xl shadow-lg p-5 flex flex-col bg-white border-2 group transition hover:-translate-y-1 hover:shadow-xl ${
                Number(prod.cantidad) <= Number(prod.cantidadMinima || 0)
                  ? "border-red-400"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <CategoriaIcono categoria={prod.categoria} />
                <h3 className="text-lg font-semibold flex-1">
                  {prod.nombre}
                  <IndicadorStockBajo cantidad={prod.cantidad} cantidadMinima={prod.cantidadMinima} />
                </h3>
              </div>
              <div className="flex flex-col gap-1 text-gray-700 text-sm mb-4">
                <div className="flex gap-2 items-center">
                  <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                    {prod.cantidad} {prod.unidad}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
                    Stock mínimo: <b>{prod.cantidadMinima}</b>
                  </span>
                </div>
                <div>
                  <span className="bg-gray-200 text-gray-500 px-2 py-0.5 rounded text-xs">
                    {prod.categoria}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  className="px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded font-semibold flex-1 transition"
                  onClick={() => handleEdit(prod)}
                  title="Editar"
                >
                  <span role="img" aria-label="edit">✏️</span> Editar
                </button>
                <button
                  className="px-2 py-1 bg-red-400 hover:bg-red-500 text-white rounded font-semibold flex-1 transition"
                  onClick={() => handleDelete(prod)}
                  title="Eliminar"
                >
                  <span role="img" aria-label="delete">🗑️</span> Eliminar
                </button>
                <button
                  className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded font-semibold flex-1 transition"
                  onClick={() => handleMovimiento(prod)}
                  title="Registrar movimiento"
                >
                  <span role="img" aria-label="move">🔄</span> Mov.
                </button>
              </div>
            </div>
          ))}
          {productos.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-6">
              Sin productos registrados.
            </div>
          )}
        </div>
      )}

      {/* Modal de crear/editar producto */}
      <ProductoForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        initialData={editData || {}}
      />

      {/* Modal de movimiento */}
      <MovimientoForm
        open={showMovimiento}
        onClose={() => {
          setShowMovimiento(false);
          setProductoMovimiento(null);
        }}
        onSave={handleRegistrarMovimiento}
        producto={productoMovimiento}
      />
    </div>
  );
};

export default InventarioView;