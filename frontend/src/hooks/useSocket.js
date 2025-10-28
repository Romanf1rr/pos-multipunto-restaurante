// frontend/src/hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || window.location.origin;

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Conectar al servidor de Socket.io
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket.io conectado');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket.io desconectado');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.io:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  return { socket: socketRef.current, isConnected, on, off, emit };
};
