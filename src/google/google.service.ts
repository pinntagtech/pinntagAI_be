import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CommandSucceededEvent } from 'typeorm';
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

      const predictions = response.data;
      // console.log("predictions:", JSON.stringify(predictions));
      if (!predictions || predictions.length === 0) {
        return {
          success: false,
          message: 'No address suggestions found',
        };
      }

      // 2. Place Details (v1) with the same sessionToken
      // const params = {
      //   key: this.GOOGLE_API_KEY,
      //   sessionToken, // same UUID you used on autocomplete
      //   fields: 'addressComponents,formattedAddress',
      // };
      // const url = `https://places.googleapis.com/v1/places/${placeId}`;
      // const dtRes = await axios.get(url, { params });

      // // 3. Extract postal_code
      // const comps: any[] = dtRes.data.addressComponents || [];
      // const postalComp = comps.find((c) => c.types.includes('postal_code'));
      // const postalCode = postalComp?.longText || null;
      // console.log('Postal Code:', postalCode);

      return {
        success: true,
        message: 'Recommendations fetched successfully',
        data: response.data.suggestions,
        // postalCode: postalCode,
        sessionToken: sessionToken,
      };
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return {
        success: false,
        message: 'Error fetching recommendations',
      };
    }
  }

  async getPlaceDetails(placeId: string, sessionToken: string) {
    try {
      const params = {
        key: this.GOOGLE_API_KEY,
        sessionToken,
        fields: 'addressComponents,formattedAddress',
      };
      const url = `https://places.googleapis.com/v1/places/${placeId}`;
      const response = await axios.get(url, { params });

      return {
        success: true,
        message: 'Place details fetched successfully',
        data: response.data,
      };

      // return response.data;
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  }

  async getAddressFromCoordinates(lat: number, lng: number): Promise<any> {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${lat},${lng}`,
            key: this.GOOGLE_API_KEY,
          },
        },
      );
      const results = response.data.results;
      if (!results.length) {
        return { success: false, message: 'No address found for coordinates' };
      }
      let addressObj =
        results.find((r) =>
          r.address_components.some((c) => c.types.includes('postal_code')),
        ) ?? null;
        if(!addressObj){
          addressObj = results[0];
        }
      const fullAddress = addressObj.formatted_address;

      const postalCodeComponent = addressObj.address_components.find((comp) =>
        comp.types.includes('postal_code'),
      );
      const postalCode = postalCodeComponent?.long_name || null;

      return {
        success: true,
        message: 'Address fetched successfully.',
        data: fullAddress,
        postalCode,
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return { success: false, message: 'Reverse geocoding failed' };
    }
  }
}
