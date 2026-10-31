import { Shipment, ShipmentStatus } from '../../domain/types';

export interface ShippingRateQuote {
  serviceName: string;
  estimatedDays: number;
  ratePaisa: number;
  codAvailable: boolean;
}

export interface TrackingTimelineEvent {
  timestamp: string;
  location: string;
  activity: string;
}

export interface IShippingAdapter {
  calculateRate(pincode: string, weightGrams: number): Promise<ShippingRateQuote>;
  createShipment(orderId: string, courierName: string, trackingNumber: string, trackingUrl?: string): Promise<Shipment>;
  trackShipment(courierName: string, trackingNumber: string): Promise<{
    status: ShipmentStatus;
    timeline: TrackingTimelineEvent[];
  }>;
}
