import { Shipment, ShipmentStatus } from '../../domain/types';
import { IShippingAdapter, ShippingRateQuote, TrackingTimelineEvent } from './types';

export class ManualShippingAdapter implements IShippingAdapter {
  async calculateRate(pincode: string, weightGrams: number): Promise<ShippingRateQuote> {
    const isValidPin = /^[1-9][0-9]{5}$/.test(pincode);
    if (!isValidPin) {
      throw new Error('Please enter a valid 6-digit Indian Postal PIN code.');
    }

    // Heavy cargo tiering: standard 250 INR up to 5kg, +100 INR per additional 5kg
    const basePaisa = 25000;
    const extraKg = Math.max(0, Math.ceil((weightGrams - 5000) / 5000));
    const ratePaisa = basePaisa + extraKg * 10000;

    return {
      serviceName: 'Standard Surface Express (Direct Line)',
      estimatedDays: 4,
      ratePaisa,
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
    let computedUrl = trackingUrl;

    if (!computedUrl) {
      if (courierName.toLowerCase().includes('bluedart')) {
        computedUrl = `https://www.bluedart.com/tracking?track=${trackingNumber}`;
      } else if (courierName.toLowerCase().includes('delhivery')) {
        computedUrl = `https://www.delhivery.com/track/package/${trackingNumber}`;
      } else if (courierName.toLowerCase().includes('dtdc')) {
        computedUrl = `https://www.dtdc.in/tracking/tracking_results.asp?trkType=AWB&strCnno=${trackingNumber}`;
      } else {
        computedUrl = `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consNo=${trackingNumber}`;
      }
    }

    return {
      id: `ship-${Date.now()}`,
      orderId,
      courierName,
      trackingNumber,
      trackingUrl: computedUrl,
      status: 'LABEL_CREATED',
      dispatchedAt: now,
      statusUpdates: [
        {
          timestamp: now,
          location: 'Central Fulfilment Hub (Pune)',
          activity: `Airway bill ${trackingNumber} assigned to ${courierName}`,
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
          location: 'Regional Sorting Facility',
          activity: `Consignment in transit with ${courierName} (AWB: ${trackingNumber})`,
        },
        {
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          location: 'Central Hub',
          activity: `Package picked up by ${courierName}`,
        },
      ],
    };
  }
}
