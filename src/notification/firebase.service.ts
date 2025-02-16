import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

// Get values from ./firebase-service-account.json
import serviceAccount from '../../firebase-service-account.json';

admin.initializeApp({
  credential: admin.credential.cert({
    // projectId: process.env.FIREBASE_PROJECT_ID,
    // clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // privateKey: process.env.FIREBASE_PRIVATE_KEY,
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key, 
       
  }),
  // databaseURL: process.env.FIREBASE_DATABASE_URL,
  databaseURL: serviceAccount.database_url,
});

@Injectable()
export class FirebaseService {
  sendNotification(token: string, title: string, body: string, data: any) {
    console.log('sending notification......');
    admin
      .messaging()
      .send({
        notification: {
          title,
          body,
        },
        data,
        token,
      })
      .then((response) => {
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
  }

  async sendMultipleNotifications(
    tokens: string[],
    title: string,
    body: string,
    data: any,
  ) {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };
    await admin.messaging().sendEachForMulticast(message);
  }
}
