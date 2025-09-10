export class GooglePubSubMessageDto {
  message: {
    data: string; // Base64-encoded DeveloperNotification JSON
    messageId: string; // Pub/Sub message ID
    publishTime: string; // Timestamp when message was published
    attributes?: { [key: string]: string }; // Any attributes (typically not used for RTDN except maybe test messages)
  };
  subscription?: string; // Subscription name (if provided by the Pub/Sub push)
}
