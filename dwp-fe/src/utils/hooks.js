import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@cart_items';

export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load cart items from AsyncStorage on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
      setError(null);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError('Không thể tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async (items) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      setCartItems(items);
    } catch (err) {
      console.error('Error saving cart:', err);
      setError('Không thể lưu giỏ hàng');
    }
  };

  const addToCart = async (item) => {
    try {
      const updatedItems = [...cartItems, { ...item, id: item.id || Date.now().toString() }];
      await saveCart(updatedItems);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Không thể thêm vào giỏ hàng');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      await saveCart(updatedItems);
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Không thể xóa khỏi giỏ hàng');
    }
  };

  const clearCart = async () => {
    try {
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Không thể xóa giỏ hàng');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price || 0);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.length;
  };

  return {
    cartItems,
    loading,
    error,
    addToCart,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    refreshCart: loadCart,
  };
};

