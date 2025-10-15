class APIService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://34.51.73.247:3000';
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
    const menuItems = response.menuItems || response.menu || [];
    // El backend responde { menuItems: [...] }
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
    // Ahora hay endpoint propio de categorías
    const response = await this.request('/api/menu/categories');
    const categories = response.categories || [];
    return categories
      .filter(cat => cat && typeof cat.id !== "undefined")
      .sort((a, b) => a.sortOrder - b.sortOrder);
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
    const response = await this.request('/api/menu/items', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
    return response.menuItem;
  }

  async updateMenuItem(id, itemData) {
    const response = await this.request(`/api/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
    return response.menuItem;
  }

  async deleteMenuItem(id) {
    return await this.request(`/api/menu/items/${id}`, { method: 'DELETE' });
  }

  async createCategory(categoryData) {
    const response = await this.request('/api/menu/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
    return response.category;
  }

  async updateCategory(id, categoryData) {
    const response = await this.request(`/api/menu/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
    return response.category;
  }
}

// Exportar instancia única
const apiService = new APIService();
export default apiService;