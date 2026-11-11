import React, { createContext, useContext, useEffect, useState } from 'react';
import { calculateCart } from '../domain/services/CartCalculationService';
import { Cart, CartItem, Coupon, Product, StoreSettings } from '../domain/types';
import { couponRepository, settingsRepository } from '../infrastructure/repositories';
import { INITIAL_SETTINGS } from '../infrastructure/repositories/seedData';
import { trackProductAddedToCart, trackProductRemovedFromCart, trackCouponApplied } from '../infrastructure/analytics/posthog';

interface CartContextType {
  cart: Cart;
  settings: StoreSettings;
  addItem: (product: Product, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  itemCount: number;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
}

const CART_STORAGE_KEY = 'vahn_cart_items_v1';
const COUPON_STORAGE_KEY = 'vahn_applied_coupon_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [coupon, setCoupon] = useState<Coupon | null>(() => {
    try {
      const stored = localStorage.getItem(COUPON_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const openCheckout = () => setIsCheckoutOpen(true);
  const closeCheckout = () => setIsCheckoutOpen(false);

  useEffect(() => {
    settingsRepository.getSettings().then(setSettings).catch(console.error);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save cart to localStorage', err);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (coupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Failed to save coupon to localStorage', err);
    }
  }, [coupon]);

  const cart = calculateCart(items, coupon, settings);

  const addItem = (product: Product, quantity = 1): { success: boolean; message?: string } => {
    if (product.stockQuantity <= 0) {
      return { success: false, message: `${product.name} is currently out of stock.` };
    }

    const existingIndex = items.findIndex((i) => i.productId === product.id);
    let newItems: CartItem[];

    if (existingIndex > -1) {
      const existing = items[existingIndex];
      const targetQty = existing.quantity + quantity;
      if (targetQty > product.stockQuantity) {
        return {
          success: false,
          message: `Cannot add more. Only ${product.stockQuantity} units available in stock.`,
        };
      }
      newItems = [...items];
      newItems[existingIndex] = {
        ...existing,
        quantity: targetQty,
        subtotalPaisa: targetQty * existing.unitPricePaisa,
      };
    } else {
      if (quantity > product.stockQuantity) {
        return {
          success: false,
          message: `Only ${product.stockQuantity} units available in stock.`,
        };
      }
      newItems = [
        ...items,
        {
          productId: product.id,
          product,
          quantity,
          unitPricePaisa: product.pricePaisa,
          subtotalPaisa: quantity * product.pricePaisa,
        },
      ];
    }

    setItems(newItems);
    trackProductAddedToCart(product, quantity);
    return { success: true };
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const clamped = Math.min(quantity, item.product.stockQuantity);
          return {
            ...item,
            quantity: clamped,
            subtotalPaisa: clamped * item.unitPricePaisa,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    const itemToRemove = items.find((i) => i.productId === productId);
    if (itemToRemove) {
      trackProductRemovedFromCart(
        itemToRemove.productId,
        itemToRemove.product.name,
        itemToRemove.unitPricePaisa,
        itemToRemove.quantity
      );
    }
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a coupon code.' };
    }

    try {
      const validCoupon = await couponRepository.getByCode(cleanCode);
      if (!validCoupon) {
        trackCouponApplied(cleanCode, 0, false, 'Invalid or expired');
        return { success: false, message: `Coupon "${cleanCode}" is invalid or expired.` };
      }

      const currentSubtotal = items.reduce((acc, i) => acc + i.unitPricePaisa * i.quantity, 0);
      if (currentSubtotal < validCoupon.minOrderPaisa) {
        const requiredRupees = validCoupon.minOrderPaisa / 100;
        trackCouponApplied(cleanCode, 0, false, 'Below minimum order');
        return {
          success: false,
          message: `Coupon requires a minimum order value of ₹${requiredRupees.toLocaleString('en-IN')}.`,
        };
      }

      setCoupon(validCoupon);
      trackCouponApplied(cleanCode, validCoupon.discountType === 'PERCENTAGE' ? (currentSubtotal * validCoupon.discountValue) / 100 : validCoupon.discountValue, true);
      return { success: true, message: `Coupon "${validCoupon.code}" applied successfully.` };
    } catch {
      trackCouponApplied(cleanCode, 0, false, 'Validation error');
      return { success: false, message: 'Could not validate coupon at this time.' };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        settings,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        itemCount,
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
