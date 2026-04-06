import { Injectable, Logger } from '@nestjs/common';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId?: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  /**
   * Converts an address string into coordinates using Google Geocoding API.
   * Returns null (and logs a warning) if the API key is missing, the address
   * couldn't be resolved, or the network call fails — so callers can degrade
   * gracefully instead of throwing.
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY is not set — geocoding skipped');
      return null;
    }

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
      const res = await fetch(url);

      if (!res.ok) {
        this.logger.warn(`Geocoding HTTP error ${res.status} for "${address}"`);
        return null;
      }

      const data: any = await res.json();

      if (data.status !== 'OK' || !data.results?.length) {
        this.logger.warn(
          `Geocoding returned status "${data.status}" for address: "${address}"`,
        );
        return null;
      }

      const first = data.results[0];
      const { lat, lng } = first.geometry.location;

      return {
        latitude: lat,
        longitude: lng,
        formattedAddress: first.formatted_address,
        placeId: first.place_id ?? undefined,
      };
    } catch (err: any) {
      this.logger.error(`Geocoding fetch error for "${address}": ${err.message}`);
      return null;
    }
  }
}
