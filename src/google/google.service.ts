import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GoogleService {
  private readonly GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  private readonly AUTOCOMPLETE_URL =
    'https://places.googleapis.com/v1/places:autocomplete';
  private readonly DETAILS_URL =
    'https://places.googleapis.com/v1/places/${placeId}';

  async googleRecommendation(data: any) {
    try {
      const sessionToken = uuidv4();
      console.log('sessionToken:', sessionToken);
      const requestBody = {
        input: data.address,
        locationBias: {
          circle: {
            center: {
              latitude: data.latitude,
              longitude: data.longitude,
            },
            radius: 500,
          },
        },
        sessionToken,
      };

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.GOOGLE_API_KEY,
          'X-Goog-FieldMask':
            'suggestions.placePrediction.text.text,suggestions.placePrediction.placeId',
        },
      };
      const response = await axios.post(
        this.AUTOCOMPLETE_URL,
        requestBody,
        config,
      );

      const predictions = response.data.suggestions;
      if (!predictions || predictions.length === 0) {
        return {
          success: false,
          message: 'No address suggestions found',
        };
      }

      const placeId = predictions[0].placePrediction.placeId;

      // 2. Place Details (v1) with the same sessionToken
      const params = {
        key: this.GOOGLE_API_KEY,
        sessionToken, // same UUID you used on autocomplete
        fields: 'addressComponents,formattedAddress',
      };
      const url = `https://places.googleapis.com/v1/places/${placeId}`;
      const dtRes = await axios.get(url, { params });

      // 3. Extract postal_code
      const comps: any[] = dtRes.data.addressComponents || [];
      const postalComp = comps.find((c) => c.types.includes('postal_code'));
      const postalCode = postalComp?.longText || null;
      console.log('Postal Code:', postalCode);

      return {
        success: true,
        message: 'Recommendations fetched successfully',
        data: response.data.suggestions,
        postalCode: postalCode,
      };
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return {
        success: false,
        message: 'Error fetching recommendations',
      };
    }
  }
}
