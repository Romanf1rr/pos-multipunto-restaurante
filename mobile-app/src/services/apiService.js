import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

class APIService {
  constructor() {
    this.baseURL = API_URL;
    this.token = null;
  }

  async init() {
    this.token = await AsyncStorage.getItem('pos_token');
  }

  async login(username, password) {
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        username,
        password,
        deviceId: `mobile_${Date.now()}`
      });

      if (response.data.success) {
        this.token = response.data.token;
        await AsyncStorage.setItem('pos_token', this.token);
        await AsyncStorage.setItem('pos_user', JSON.stringify(response.data.user));
        return response.data;
      }
      throw new Error(response.data.error || 'Error de autenticación');
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    this.token = null;
    await AsyncStorage.removeItem('pos_token');
    await AsyncStorage.removeItem('pos_user');
  }

  async getMenu() {
    const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
    const response = await axios.get(`${this.baseURL}/api/menu`, { headers });
    return response.data.menuItems || [];
  }

  async getCategories() {
    const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
    const response = await axios.get(`${this.baseURL}/api/menu/categories`, { headers });
    return response.data.categories || [];
  }
}

export default new APIService();