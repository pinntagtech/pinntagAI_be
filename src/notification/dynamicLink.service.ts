import { Injectable } from '@nestjs/common';
import { FirebaseDynamicLinks } from 'firebase-dynamic-links';

@Injectable()
export class DynamicLinkService {
  private firebaseDynamicLinks: FirebaseDynamicLinks;
  constructor() {
    this.firebaseDynamicLinks = new FirebaseDynamicLinks(
      process.env.FIREBASE_API_KEY,
    );
  }

  async generateShortLink(
    longUrl: string,
    event: {
      title: string;
      description: string;
      imageUrl: string;
      businessName: string;
      // date: string;
    },
  ) {
    const { title, description, imageUrl, businessName } = event;
    const { shortLink, previewLink } =
      await this.firebaseDynamicLinks.createLink({
        dynamicLinkInfo: {
          link: longUrl,
          domainUriPrefix: 'https://getpinntag.page.link',
          androidInfo: {
            androidPackageName: 'com.pinntag.pinntagUS',
            // minimumVersion: 30
          },
          iosInfo: {
            iosBundleId: 'com.pinntag.pinntagUS',
            iosAppStoreId: '6448201172',
            // iosMinimumVersion: '1.0.1'
          },
          socialMetaTagInfo: {
            socialTitle: `${title} by ${businessName} brought to you by Pinntag.`,
            socialDescription: description,
            socialImageLink: imageUrl,
          },
        },
      });

    return { shortLink, previewLink };
  }
}
