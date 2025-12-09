import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { FacebookService } from './facebook.service';
import axios from 'axios';

@Controller('facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Post('business/:id')
  async facebookLogin(@Param('id') id: string) {
    try {
      const clientId = process.env.FACEBOOK_CLIENT_ID;
      const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
      const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        throw new InternalServerErrorException(
          'Facebook OAuth env vars not configured',
        );
      }

      const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_CLIENT_ID,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        state: id,
        scope:
          'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
        response_type: 'code',
      });

      const url = `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;

      return { url };
    } catch (error) {
      console.error('something went wrong!');
    }
  }

  @Get('callback')
  async facebookCallback(
    @Query('token') token: string,
    @Query('businessId') businessId: string, // we'll use this for businessId
  ) {
    if (!token) {
      throw new BadRequestException('Missing "token" from Facebook');
    }
    if (!businessId) {
      throw new BadRequestException('Missing "state" (businessId)');
    }

    // In your flow, you can encode/decode state if needed.

    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException(
        'Facebook OAuth env vars not configured',
      );
    }

    // 1️⃣ Exchange "code" -> short-lived user access token
    let shortLivedToken: string;
    let shortTokenExpiresIn: number;

    try {
      const tokenRes = await axios.get(
        'https://graph.facebook.com/v20.0/oauth/access_token',
        {
          params: {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            token,
          },
        },
      );
      console.log('token res;::', tokenRes);

      shortLivedToken = tokenRes.data.access_token;
      shortTokenExpiresIn = tokenRes.data.expires_in;
    } catch (error) {
      console.error(
        'Error exchanging code for short-lived token:',
        error.response?.data || error.message,
      );
      throw new BadRequestException('Failed to exchange code for access token');
    }

    // 2️⃣ Convert short-lived user token -> long-lived user token
    const longLived =
      await this.facebookService.fetchLongLivedToken(shortLivedToken);

    if (!longLived.success) {
      throw new InternalServerErrorException(
        'Failed to get long-lived token: ' + JSON.stringify(longLived.data),
      );
    }

    const longLivedUserToken = longLived.data.access_token;
    const longLivedExpiresIn = longLived.data.expires_in;

    // 3️⃣ Fetch user info (/me)
    let fbUser: any;
    try {
      const meRes = await axios.get('https://graph.facebook.com/v20.0/me', {
        params: {
          access_token: longLivedUserToken,
          fields: 'id,name',
        },
      });
      fbUser = meRes.data; // { id, name }
    } catch (error) {
      console.error(
        'Error fetching Facebook user:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to fetch Facebook user info',
      );
    }

    // 4️⃣ Fetch pages that user manages (/me/accounts)
    let pages: any[];
    try {
      const pagesRes = await axios.get(
        'https://graph.facebook.com/v20.0/me/accounts',
        {
          params: {
            access_token: longLivedUserToken,
          },
        },
      );
      pages = pagesRes.data.data; // array of pages
    } catch (error) {
      console.error(
        'Error fetching Facebook pages:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to fetch Facebook pages');
    }

    // 🔁 At this point you usually:
    // - Store longLivedUserToken server-side (NOT send to frontend in production)
    // - Let frontend show `pages` list for the user to select one

    // For now, we return data so you can see it's working.
    return {
      businessId,
      fbUser, // { id, name }
      pages, // [{ id, name, access_token, ... }, ...]
      longLivedUserToken, // hide this from frontend later
      longLivedExpiresIn,
      shortTokenExpiresIn,
    };
  }
}
