import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import apiService from '../services/apiService';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.login(username, password);
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>🏪</Text>
        <Text style={styles.title}>POS Multipunto</Text>
        <Text style={styles.subtitle}>Tablet & Móvil</Text>

        <TextInput
          style={styles.input}
          placeholder='Usuario'
          value={username}
          onChangeText={setUsername}
          autoCapitalize='none'
        />

        <TextInput
          style={styles.input}
          placeholder='Contraseña'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color='#fff' />
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <View style={styles.helpText}>
          <Text style={styles.helpTitle}>Usuarios de prueba:</Text>
          <Text style={styles.helpItem}>• Admin: admin / admin123</Text>
          <Text style={styles.helpItem}>• Mesero: tablet1 / tablet123</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    marginTop: 20,
    width: '100%',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 5,
  },
  helpItem: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3,
  },
});