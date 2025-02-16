import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor() {}
  afterInit(server: any) {
    throw new Error('Method not implemented.');
  }
//   io.use((socket: Socket, next: (err?: any) => void) => {
//     const token: string | string[] = socket.handshake.query.token;
//     if (!token) {
//       return next(new Error("Authentication error! No token provided."));
//     }
//     jwt.verify(token, process.env.JWT_SECRET, (err: any, decoded: any) => {
//       if (err) {
//         return next(new Error("Authentication error! Invalid token."));
//       }
//       socket["user"] = decoded.userId;
//       next();
//     });
//   });
  @WebSocketServer() server;

  @SubscribeMessage('msgToServer')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  handleConnection(client: any, ...args: any[]) {
    console.log('Client connected');
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected');
  }
}
