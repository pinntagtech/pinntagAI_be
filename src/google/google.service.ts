import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { length } from 'class-validator';
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

      const requestBody: Record<string, any> = {
        input: data.address,
        // locationBias: {
        //   circle: {
        //     center: {
        //       latitude: data.latitude,
        //       longitude: data.longitude,
        //     },
        //     radius: 500,
        //   },
        // },
        sessionToken,
      };
      if (
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number'
      ) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: data.latitude,
              longitude: data.longitude,
            },
            radius: 500,
          },
        };
      }

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
  mapGoogleAddressToSchema(addressComponents: any[] = []) {
    const getComponent = (type: string) =>
      addressComponents.find((c) => c.types?.includes(type));

    const getComponentValue = (type: string) => {
      const component = getComponent(type);
      // Google usually sends long_name / short_name
      return (
        component?.longText ||
        component?.long_name ||
        component?.short_name ||
        ''
      ).trim();
    };

    // Build address1 with sensible fallbacks:
    // 1) street_number + route
    // 2) premise / establishment
    // 3) plus_code (last resort for rural/open areas)
    let address1 = [
      getComponentValue('street_number'),
      getComponentValue('route'),
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!address1) {
      address1 =
        getComponentValue('premise') ||
        getComponentValue('establishment') ||
        getComponentValue('plus_code') || // from your data: "HMQX+CW5"
        '';
    }

    // address2 as locality / village / sublocality
    const address2 =
      getComponentValue('sublocality') ||
      getComponentValue('locality') ||
      getComponentValue('neighborhood') ||
      '';

    // City: prefer admin_area_3 (district) over locality for India
    const city =
      getComponentValue('administrative_area_level_3') || // Muzaffarnagar
      getComponentValue('locality') || // Rohana Khurd
      getComponentValue('postal_town') ||
      getComponentValue('administrative_area_level_2') ||
      '';

    const state =
      getComponentValue('administrative_area_level_1') ||
      getComponentValue('administrative_area_level_2') ||
      '';

    const country = getComponentValue('country');
    const postalCode = getComponentValue('postal_code');

    return {
      address1,
      address2,
      city,
      state,
      country,
      postalCode,
    };
  }

  async getPlaceDetails(
    placeId: string,
    sessionToken: string,
    selectedAddress: string,
  ) {
    try {
      const params = {
        key: this.GOOGLE_API_KEY,
        sessionToken,
        fields: 'addressComponents,formattedAddress,location',
      };
      const url = `https://places.googleapis.com/v1/places/${placeId}`;
      const response = await axios.get(url, { params });
      console.log('Response:', JSON.stringify(response.data));
      let address = this.mapGoogleAddressToSchema(
        response.data.addressComponents,
      );
      address['latitude'] = response.data.location.latitude;
      address['longitude'] = response.data.location.longitude;
      if (selectedAddress) {
        address['selectedAddress'] = selectedAddress;
      }
      address['fullAddressString'] = response.data.formattedAddress;

      return {
        success: true,
        message: 'Place details fetched successfully',
        data: address,
      };
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  }
  async getPlaceDetailsWithMetaData(placeId: string) {
    try {
      const params = {
        key: this.GOOGLE_API_KEY,
        fields: [
          'displayName',
          'formattedAddress',
          'location',
          'regularOpeningHours',
          'currentOpeningHours',
          'photos',
          'rating',
          'userRatingCount',
          'priceLevel',
          'websiteUri',
          'googleMapsUri',
          'nationalPhoneNumber',
          'primaryType',
          'types',
        ].join(','),
      };
      const url = `https://places.googleapis.com/v1/places/${placeId}`;
      const response = await axios.get(url, { params });

      return {
        success: true,
        message: 'Place details fetched successfully',
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  }

  async getAddressFromCoordinates(
    lat: number,
    lng: number,
    apiKey: string,
  ): Promise<any> {
    try {
      if (apiKey != '000e10b3-b0a0-4269-a864-ea419a790f76') {
        throw new Error('Invalid API key');
      }
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
      console.log('Geocode results:', JSON.stringify(results));
      if (!results.length) {
        return { success: false, message: 'No address found for coordinates' };
      }
      let addressObj =
        results.find((r) =>
          r.address_components.some((c) => c.types.includes('postal_code')),
        ) ?? null;
      if (!addressObj) {
        addressObj = results[0];
      }
      // const fullAddress = addressObj.formatted_address;

      // const postalCodeComponent = addressObj.address_components.find((comp) =>
      //   comp.types.includes('postal_code'),
      // );
      // const postalCode = postalCodeComponent?.long_name || null;

      const address = this.mapGoogleAddressToSchema(
        addressObj.address_components,
      );

      return {
        success: true,
        message: 'Address fetched successfully.',
        data: address,
        // postalCode,
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return { success: false, message: 'Reverse geocoding failed' };
    }
  }
}
