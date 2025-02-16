import { Injectable } from '@nestjs/common';
import axios from 'axios';
import qs from 'qs';

@Injectable()
export class FacebookService {
  constructor() {}
  async fetchLongLivedToken(token: string) {
    const client_id = process.env.FACEBOOK_CLIENT_ID;
    const client_secret = process.env.FACEBOOK_CLIENT_SECRET;
    const fb_exchange_token = token;
    const grant_type = 'fb_exchange_token';

    const config = {
      method: 'get',
      url: `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=${grant_type}&client_id=${client_id}&client_secret=${client_secret}&fb_exchange_token=${fb_exchange_token}`,
      headers: {},
    };

    const result = axios
      .request(config)
      .then((response) => {
        console.log(response.data);
        return {
          success: true,
          data: response.data,
        };
      })
      .catch((error) => {
        console.log(error);
        return {
          success: false,
          data: error.message,
        };
      });
    return result;
  }

  async createSocialPost(
    token: string,
    message: string,
    mediaIds: Array<string>,
  ) {
    const data = {
      message,
    };
    if (mediaIds.length > 0) {
      mediaIds.forEach((mediaId, index) => {
        data[`attached_media[${index}]`] = `{media_fbid:${mediaId}}`;
      });
    }

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://graph.facebook.com/me/feed',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`,
      },
      data: qs.stringify(data),
    };
    console.log('config for facebook:-----------', config);
    const result = axios
      .request(config)
      .then((response) => {
        console.log(response.data);
        return {
          success: true,
          data: response.data,
        };
      })
      .catch((error) => {
        console.log(error);
        return {
          success: false,
          data: error.message,
        };
      });
    return result;
  }

  async uploadImage(token: string, url: string) {
    const data = JSON.stringify({
      access_token: token,
      published: false,
      url,
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://graph.facebook.com/me/photos',
      headers: {
        'Content-Type': 'application/json',
      },
      data,
    };

    const result = axios.request(config).then(
      (response) => {
        console.log(response.data);
        return {
          success: true,
          data: response.data,
        };
      },
      (error) => {
        console.log(error);
        return {
          success: false,
          data: error.message,
        };
      },
    );
    return result;
  }
}
