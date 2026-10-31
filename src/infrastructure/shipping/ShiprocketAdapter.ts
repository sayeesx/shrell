import { Shipment, ShipmentStatus } from '../../domain/types';
import { IShippingAdapter, ShippingRateQuote, TrackingTimelineEvent } from './types';

export class ShiprocketAdapter implements IShippingAdapter {
  private email: string;
  private password?: string;

  constructor(email?: string, password?: string) {
    this.email = email || import.meta.env.VITE_SHIPROCKET_EMAIL || '';
    this.password = password || import.meta.env.VITE_SHIPROCKET_PASSWORD || '';
  }

  get isConfigured(): boolean {
    return Boolean(this.email && this.password);
  }

  async calculateRate(pincode: string, weightGrams: number): Promise<ShippingRateQuote> {
    const extraPaisa = Math.max(0, Math.ceil((weightGrams - 2000) / 1000) * 2000);
    if (!this.isConfigured) {
      return {
        serviceName: `Shiprocket Aggregator (PIN: ${pincode})`,
        estimatedDays: 3,
        ratePaisa: 28000 + extraPaisa,
        codAvailable: true,
      };
    }

    return {
      serviceName: `Shiprocket Smart Surface (Destination: ${pincode})`,
      estimatedDays: 3,
      ratePaisa: 26000 + extraPaisa,
      codAvailable: true,
    };
  }

  async createShipment(
    orderId: string,
    courierName: string,
    trackingNumber: string,
    trackingUrl?: string
  ): Promise<Shipment> {
    const now = new Date().toISOString();
    return {
      id: `sr-${Date.now()}`,
      orderId,
      courierName: courierName || 'Shiprocket Partner Courier',
      trackingNumber,
      trackingUrl: trackingUrl || `https://shiprocket.co/tracking/${trackingNumber}`,
      status: 'LABEL_CREATED',
      dispatchedAt: now,
      statusUpdates: [
        {
          timestamp: now,
          location: 'Origin Warehouse',
          activity: `Shipment manifest generated via Shiprocket for AWB ${trackingNumber}`,
        },
      ],
    };
  }

  async trackShipment(
    courierName: string,
    trackingNumber: string
  ): Promise<{ status: ShipmentStatus; timeline: TrackingTimelineEvent[] }> {
    return {
      status: 'IN_TRANSIT',
      timeline: [
        {
          timestamp: new Date().toISOString(),
          location: 'Shiprocket Transit Hub',
          activity: `Shipment scanning underway (${courierName} - AWB: ${trackingNumber})`,
        },
      ],
    };
  }
}
