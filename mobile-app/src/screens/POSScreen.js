import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

export default function POSScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('pos_user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      await apiService.init();
      const [cats, items] = await Promise.all([
        apiService.getCategories(),
        apiService.getMenu()
      ]);

      setCategories(cats);
      setMenuItems(items);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await apiService.logout();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#4F46E5' />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>POS Multipunto</Text>
          <Text style={styles.headerSubtitle}>
            {user?.name} ({user?.role})
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>📊 Dashboard</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{menuItems.length}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{categories.length}</Text>
            <Text style={styles.statLabel}>Categorías</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🍽️ Menú ({menuItems.length} productos)</Text>
        {menuItems.slice(0, 10).map(item => (
          <View key={item.id} style={styles.menuCard}>
            <View style={styles.menuInfo}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuCategory}>{item.categoryName}</Text>
            </View>
            <Text style={styles.menuPrice}>\</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  menuCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  menuCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  menuPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
});