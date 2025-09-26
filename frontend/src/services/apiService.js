// frontend/src/services/apiService.js
class APIService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    this.token = localStorage.getItem('pos_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };

    try {
      const response = await fetch(url, { headers, ...options });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`Error en ${options.method || 'GET'} ${endpoint}:`, error);
      throw error;
    }
  }

  // Autenticación
  async login(username, password, deviceId) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, deviceId })
    });
    
    if (response.success) {
      this.token = response.token;
      localStorage.setItem('pos_token', this.token);
    }
    return response;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
  }

  // Menú y Categorías
  async getMenu() {
    const response = await this.request('/api/menu');
    const menuItems = response.menu || [];
    
    // Transformar el formato del backend al formato que espera el frontend
    return menuItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      cost: parseFloat(item.cost || 0),
      image: item.image,
      stock: item.stock,
      isActive: item.isActive,
      categoryId: item.Category ? item.Category.id : null,
      categoryName: item.Category ? item.Category.name : 'Sin categoría'
    }));
  }

  async getCategories() {
    // Obtener categorías desde el endpoint de menú ya que /api/categories no existe
    const response = await this.request('/api/menu');
    const menuItems = response.menu || [];
    
    // Extraer categorías únicas de los productos del menú
    const categoriesMap = new Map();
    menuItems.forEach(item => {
      if (item.Category && !categoriesMap.has(item.Category.id)) {
        categoriesMap.set(item.Category.id, {
          id: item.Category.id,
          name: item.Category.name,
          description: item.Category.description,
          sortOrder: item.Category.sortOrder
        });
      }
    });
    
    // Convertir Map a array y ordenar por sortOrder
    return Array.from(categoriesMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Mesas
  async getTables() {
    const response = await this.request('/api/tables');
    return response.tables || [];
  }

  async updateTableStatus(id, status) {
    return await this.request(`/api/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Clientes
  async getCustomers() {
    const response = await this.request('/api/customers');
    return response.customers || [];
  }

  async createCustomer(customerData) {
    const response = await this.request('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
    return response.customer;
  }

  // Ventas
  async createSale(saleData) {
    return await this.request('/api/sales', {
      method: 'POST',
      body: JSON.stringify(saleData)
    });
  }

  // Health check
  async healthCheck() {
    return await this.request('/api/health');
  }

  // Métodos para MenuManagementView
  async createMenuItem(itemData) {
    const response = await this.request('/api/menu', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    return response.menuItem;
  }

  async updateMenuItem(id, itemData) {
    const response = await this.request(`/api/menu/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(itemData)
    });
    return response.menuItem;
  }

  async deleteMenuItem(id) {
    return await this.request(`/api/menu/${id}`, { method: 'DELETE' });
  }

  async createCategory(categoryData) {
    const response = await this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
    return response.category;
  }

  async updateCategory(id, categoryData) {
    const response = await this.request(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData)
    });
    return response.category;
  }
}

// Exportar instancia única
const apiService = new APIService();
export default apiService;