import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface AppLinkParams {
  url: string;
  name: string;
  urlPrefix?: string; // Your custom domain (without http/https)
  shortId?: string; // If not set, it will be auto-generated
  socialMeta: {
    title: string;
    description: string;
    imageUrl: string;
  };
  androidFallbackUrl?: string;
  iosFallbackUrl?: string;
  isOpenInAndroidApp?: boolean;
  isOpenInBrowserAndroid?: boolean;
  isOpenInIosApp?: boolean;
  isOpenInBrowserApple?: boolean;
}

export interface AppLinkResponse {
  shortLink: string;
  previewLink: string;
  linkId?: string;
}

@Injectable()
export class AppsOnAirLinkService {
  private readonly apiKey: string;
  private readonly appId: string;
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.apiKey = process.env.APPSONAIR_API_KEY;
    this.appId = process.env.APPSONAIR_APP_ID;
    this.baseUrl =
      process.env.APPSONAIR_BASE_URL || 'https://api.appsonair.com'; // Assumed endpoint

    if (!this.apiKey || !this.appId) {
      throw new Error(
        'AppsOnAir API key and App ID must be provided in environment variables',
      );
    }
  }

  async generateShortLink(
    longUrl: string,
    event: {
      title: string;
      description: string;
      imageUrl: string;
      businessName: string;
    },
  ): Promise<AppLinkResponse> {
    const { title, description, imageUrl, businessName } = event;

    const appLinkParams: AppLinkParams = {
      url: longUrl,
      name: `${title} by ${businessName}`,
      urlPrefix: process.env.APPSONAIR_DOMAIN_PREFIX, // e.g., 'links.yourdomain.com'
      socialMeta: {
        title: `${title} by ${businessName} brought to you by Pinntag.`,
        description,
        imageUrl,
      },
      androidFallbackUrl:
        'https://play.google.com/store/apps/details?id=com.pinntag.pinntagUS',
      iosFallbackUrl: 'https://apps.apple.com/app/id6448201172',
      isOpenInAndroidApp: true,
      isOpenInBrowserAndroid: false,
      isOpenInIosApp: true,
      isOpenInBrowserApple: false,
    };

    try {
      // Method 1: Direct API approach (needs to be confirmed with AppsOnAir documentation)
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v1/applinks/create`, // Assumed endpoint
          {
            appId: this.appId,
            ...appLinkParams,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        shortLink: response.data.shortLink,
        previewLink: response.data.previewLink,
        linkId: response.data.linkId,
      };
    } catch (error) {
      console.error(
        'Error creating AppsOnAir AppLink:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to create AppLink',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Alternative method using a wrapper around their SDK approach
  async generateShortLinkAlternative(
    longUrl: string,
    event: {
      title: string;
      description: string;
      imageUrl: string;
      businessName: string;
    },
  ): Promise<AppLinkResponse> {
    const { title, description, imageUrl, businessName } = event;

    try {
      // This approach might require a Node.js wrapper around their mobile SDK
      // or using their web dashboard API (if available)
      const payload = {
        api_key: this.apiKey,
        app_id: this.appId,
        link_data: {
          url: longUrl,
          name: `${title} by ${businessName}`,
          domain_prefix: process.env.APPSONAIR_DOMAIN_PREFIX,
          social_meta: {
            title: `${title} by ${businessName} brought to you by Pinntag.`,
            description,
            image_url: imageUrl,
          },
          android: {
            fallback_url:
              'https://play.google.com/store/apps/details?id=com.pinntag.pinntagUS',
            open_in_app: true,
          },
          ios: {
            fallback_url: 'https://apps.apple.com/app/id6448201172',
            open_in_app: true,
          },
        },
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/create-link`, // Alternative assumed endpoint
          payload,
          {
            headers: {
              'X-API-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        shortLink: response.data.short_link || response.data.shortLink,
        previewLink: response.data.preview_link || response.data.previewLink,
        linkId: response.data.link_id || response.data.linkId,
      };
    } catch (error) {
      console.error(
        'Alternative AppsOnAir AppLink creation failed:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to create AppLink using alternative method',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Method to get link analytics (if supported by API)
  async getLinkAnalytics(linkId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/v1/applinks/${linkId}/analytics`,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      console.error(
        'Error fetching link analytics:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to fetch link analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Method to update an existing link
  async updateAppLink(linkId: string, updateData: Partial<AppLinkParams>) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.baseUrl}/v1/applinks/${linkId}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      console.error(
        'Error updating AppLink:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to update AppLink',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
