import { Cart, Order, Product } from '../../domain/types';
import { formatINR } from '../../domain/services/CurrencyService';

export class WhatsAppService {
  private phoneNumber: string;

  constructor(phoneNumber?: string) {
    this.phoneNumber =
      phoneNumber || import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || '919876543210';
  }

  /**
   * Generates a universal WhatsApp Click-to-Chat deep link.
   * Works on mobile browsers, WhatsApp Web, and native desktop clients.
   */
  generateLink(message: string): string {
    const encoded = encodeURIComponent(message.trim());
    return `https://wa.me/${this.phoneNumber}?text=${encoded}`;
  }

  /**
   * General support inquiry message.
   */
  getGeneralSupportLink(): string {
    const msg = `Hello SHRELL team, I have an inquiry regarding your automotive equipment catalogue.`;
    return this.generateLink(msg);
  }

  /**
   * Product-specific technical inquiry link.
   */
  getProductInquiryLink(product: Product, selectedVehicle?: string): string {
    let msg = `Hello SHRELL,\n\nI am inquiring about:\n*${product.name}*\nSKU: ${product.sku}\nPrice: ${formatINR(
      product.pricePaisa
    )}`;

    if (selectedVehicle) {
      msg += `\nVehicle Compatibility: ${selectedVehicle}`;
    }

    msg += `\n\nCould you please share stock availability and installation details?`;
    return this.generateLink(msg);
  }

  /**
   * Cart-to-WhatsApp ordering link for customers who prefer WhatsApp assistance.
   */
  getCartToWhatsAppLink(cart: Cart): string {
    let msg = `Hello SHRELL,\n\nI would like to place an order via WhatsApp:\n`;

    cart.items.forEach((item, index) => {
      msg += `\n${index + 1}. *${item.product.name}* (x${item.quantity}) - ${formatINR(
        item.subtotalPaisa
      )}`;
    });

    msg += `\n\nSubtotal: ${formatINR(cart.subtotalPaisa)}`;
    if (cart.discountPaisa > 0) {
      msg += `\nDiscount: -${formatINR(cart.discountPaisa)}`;
    }
    msg += `\nShipping: ${cart.shippingPaisa === 0 ? 'FREE' : formatINR(cart.shippingPaisa)}`;
    msg += `\n*Final Total: ${formatINR(cart.totalPaisa)}*`;
    msg += `\n\nPlease share delivery steps and payment instructions.`;

    return this.generateLink(msg);
  }

  /**
   * Order status inquiry link.
   */
  getOrderSupportLink(order: Order): string {
    const msg = `Hello SHRELL,\n\nI am checking on the status of my Order:\nOrder ID: *${order.id}*\nCustomer Name: ${order.customerName}\nPhone: ${order.customerPhone}\nStatus: ${order.status}`;
    return this.generateLink(msg);
  }
}

export const whatsAppService = new WhatsAppService();
