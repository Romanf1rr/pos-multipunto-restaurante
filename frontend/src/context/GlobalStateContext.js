// frontend/src/context/GlobalStateContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Tipos de acciones
const ACTIONS = {
  SET_CART: 'SET_CART',
  ADD_TO_CART: 'ADD_TO_CART',
  UPDATE_CART_ITEM: 'UPDATE_CART_ITEM',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  CLEAR_CART: 'CLEAR_CART',
  SET_TABLES: 'SET_TABLES',
  UPDATE_TABLE: 'UPDATE_TABLE',
  ADD_TABLE: 'ADD_TABLE',
  REMOVE_TABLE: 'REMOVE_TABLE',
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  ADD_CUSTOMER: 'ADD_CUSTOMER',
  SET_MENU_ITEMS: 'SET_MENU_ITEMS',
  SET_CATEGORIES: 'SET_CATEGORIES'
};

// Estado inicial
const initialState = {
  cart: {}, // { 'table-1': [...], 'delivery-2': [...], 'takeaway': [...] }
  tables: [],
  customers: [],
  menuItems: [],
  categories: []
};

// Reducer para manejar el estado
function globalReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CART:
      return {
        ...state,
        cart: action.payload
      };

    case ACTIONS.ADD_TO_CART: {
      const { cartKey, item } = action.payload;
      const currentCart = state.cart[cartKey] || [];
      const existingItem = currentCart.find(cartItem => cartItem.id === item.id);
      
      let newCart;
      if (existingItem) {
        newCart = currentCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        newCart = [...currentCart, { ...item, quantity: 1 }];
      }

      return {
        ...state,
        cart: {
          ...state.cart,
          [cartKey]: newCart
        }
      };
    }

    case ACTIONS.UPDATE_CART_ITEM: {
      const { cartKey, itemId, quantity } = action.payload;
      const currentCart = state.cart[cartKey] || [];
      
      let newCart;
      if (quantity === 0) {
        newCart = currentCart.filter(item => item.id !== itemId);
      } else {
        newCart = currentCart.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );
      }

      return {
        ...state,
        cart: {
          ...state.cart,
          [cartKey]: newCart
        }
      };
    }

    case ACTIONS.CLEAR_CART: {
      const { cartKey } = action.payload;
      return {
        ...state,
        cart: {
          ...state.cart,
          [cartKey]: []
        }
      };
    }

    case ACTIONS.SET_TABLES:
      return {
        ...state,
        tables: action.payload
      };

    case ACTIONS.UPDATE_TABLE: {
      const updatedTable = action.payload;
      return {
        ...state,
        tables: state.tables.map(table =>
          table.id === updatedTable.id ? updatedTable : table
        )
      };
    }

    case ACTIONS.ADD_TABLE:
      return {
        ...state,
        tables: [...state.tables, action.payload]
      };

    case ACTIONS.REMOVE_TABLE:
      return {
        ...state,
        tables: state.tables.filter(table => table.id !== action.payload)
      };

    case ACTIONS.SET_CUSTOMERS:
      return {
        ...state,
        customers: action.payload
      };

    case ACTIONS.ADD_CUSTOMER:
      return {
        ...state,
        customers: [...state.customers, action.payload]
      };

    case ACTIONS.SET_MENU_ITEMS:
      return {
        ...state,
        menuItems: action.payload
      };

    case ACTIONS.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload
      };

    default:
      return state;
  }
}

// Context
const GlobalStateContext = createContext();

// Hook personalizado para usar el contexto
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState debe usarse dentro de GlobalStateProvider');
  }
  return context;
};

// Provider del contexto
export const GlobalStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  // Persistir en localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('pos_global_state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: ACTIONS.SET_CART, payload: parsedState.cart || {} });
      } catch (error) {
        console.error('Error cargando estado guardado:', error);
      }
    }
  }, []);

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    localStorage.setItem('pos_global_state', JSON.stringify({
      cart: state.cart
    }));
  }, [state.cart]);

  // Acciones del carrito
  const addToCart = (cartKey, item) => {
    dispatch({
      type: ACTIONS.ADD_TO_CART,
      payload: { cartKey, item }
    });
  };

  const updateCartItem = (cartKey, itemId, quantity) => {
    dispatch({
      type: ACTIONS.UPDATE_CART_ITEM,
      payload: { cartKey, itemId, quantity }
    });
  };

  const clearCart = (cartKey) => {
    dispatch({
      type: ACTIONS.CLEAR_CART,
      payload: { cartKey }
    });
  };

  const getCurrentCart = (cartKey) => {
    return cartKey ? state.cart[cartKey] || [] : [];
  };

  const hasItemsInCart = (cartKey) => {
    return state.cart[cartKey] && state.cart[cartKey].length > 0;
  };

  // Acciones de mesas
  const setTables = (tables) => {
    dispatch({ type: ACTIONS.SET_TABLES, payload: tables });
  };

  const updateTable = (table) => {
    dispatch({ type: ACTIONS.UPDATE_TABLE, payload: table });
  };

  const addTable = (table) => {
    dispatch({ type: ACTIONS.ADD_TABLE, payload: table });
  };

  const removeTable = (tableId) => {
    dispatch({ type: ACTIONS.REMOVE_TABLE, payload: tableId });
  };

  // Acciones de clientes
  const setCustomers = (customers) => {
    dispatch({ type: ACTIONS.SET_CUSTOMERS, payload: customers });
  };

  const addCustomer = (customer) => {
    dispatch({ type: ACTIONS.ADD_CUSTOMER, payload: customer });
  };

  // Acciones de menú
  const setMenuItems = (menuItems) => {
    dispatch({ type: ACTIONS.SET_MENU_ITEMS, payload: menuItems });
  };

  const setCategories = (categories) => {
    dispatch({ type: ACTIONS.SET_CATEGORIES, payload: categories });
  };

  const value = {
    // Estado
    cart: state.cart,
    tables: state.tables,
    customers: state.customers,
    menuItems: state.menuItems,
    categories: state.categories,

    // Acciones del carrito
    addToCart,
    updateCartItem,
    clearCart,
    getCurrentCart,
    hasItemsInCart,

    // Acciones de mesas
    setTables,
    updateTable,
    addTable,
    removeTable,

    // Acciones de clientes
    setCustomers,
    addCustomer,

    // Acciones de menú
    setMenuItems,
    setCategories
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};