import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UserTypes } from '../enums/auth.enums';
import { DecodedUser } from '../auth/interfaces/decodedUser.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { User, UserDocument } from '../user/models/user.model';
import { BusinessUser, BusinessUserDocument } from '../business/model/businessUser.model';
import { Admin, AdminDocument } from '../admin/models/admin.model';
import { GetDashboardDto } from '../auth/dto/getDashboard.dto';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  namespace: '/dashboard-socket',
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  typingUsers: Record<string, string[]> = {};

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    private readonly logger: Logger,
  ) {}

  afterInit(server: Server) {
    server.use((socket: Socket, next) => {
      const token = socket.handshake.query.token as string;
      if (!token) {
        return next(new Error('Authentication error! No token provided.'));
      }
      try {
        const decoded: any = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        if (!decoded || !decoded.id) {
          return next(new Error('Authentication error'));
        }
        (socket as any).userId = decoded.id;
        (socket as any).userType = decoded.userType;
        this.logger.log(`socket initialized with userId: ${decoded.id}`);
        next();
      } catch (err) {
        return next(new Error('Authentication error'));
      }
    });
  }

  async handleConnection(client: Socket) {
    const userId = (client as any).userId;
    const userType = (client as any).userType;
    try {
      if (userType === UserTypes.USER) {
        const user = await this.userModel.findById(userId);
        if (!user) return client.emit('errorMessage', 'User not found');
      } else if (userType === UserTypes.BUSINESS) {
        const user = await this.businessUserModel.findById(userId);
        if (!user) return client.emit('errorMessage', 'User not found');
      } else if (userType === UserTypes.ADMIN) {
        const user = await this.adminModel.findById(userId);
        if (!user) return client.emit('errorMessage', 'User not found');
      }
      client.join(userId);
      client.emit('successMessage', 'Connected successfully');
    } catch (err) {
      this.logger.error('Connection Error:', err);
      client.emit('errorMessage', 'Internal server error');
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    for (const room in this.typingUsers) {
      const index = this.typingUsers[room]?.indexOf(userId);
      if (index !== -1) {
        this.typingUsers[room].splice(index, 1);
        client.to(room).emit('typingUsers', this.typingUsers[room]);
      }
    }
    this.logger.log(`Client ${userId} disconnected`);
  }

  @SubscribeMessage('getDashboardAllConfigs')
  async handleGetDashboardAllConfigs(client: Socket) {
    const result = await this.authService.getDashboardAllConfigs();
    client.emit('getDashboardAllConfigsResponse', {
      message: result.message,
      data: result.data,
    });
  }

  @SubscribeMessage('getDashboardCarouselEvent2')
  async handleGetDashboardCarouselEvent2(
    client: Socket,
    payload: {
      body: GetDashboardDto;
      carouselId: string;
      search?: string;
      distance?: string;
      timeZone?: string;
    },
  ) {
    const { body, carouselId, search, distance, timeZone } = payload;
    const userId = (client as any).userId;
    const userType = (client as any).userType;
    const decodedUser: DecodedUser = {
      id: userId,
      userType,
      isGuest: userType === UserTypes.GUEST,
      email: '',
      role: '',
      name: '',
      token: '',
      profilePhoto: '',
      isBusiness: userType === UserTypes.BUSINESS,
    };
    const result = await this.authService.getDashboardCarouselEvent2(
      decodedUser,
      carouselId,
      parseFloat(body.latitude),
      parseFloat(body.longitude),
      distance ? parseInt(distance) : 1000000000000,
      search ? search : '',
      timeZone ? timeZone : 'America/Chicago',
      body.categories ? body.categories : [],
      body.startDate ? new Date(body.startDate) : null,
      body.endDate ? new Date(body.endDate) : null,
    );
    client.emit('getDashboardCarouselEvent2Response', {
      message: result.message,
      ...result.data,
    });
  }

  @SubscribeMessage('getEventDetails')
  async handleGetEventDetails(
    client: Socket,
    payload: { body: GetDashboardDto; eventId: string },
  ) {
    const { body, eventId } = payload;
    if (!isValidObjectId(eventId)) {
      return client.emit('getEventDetailsResponse', {
        message: 'Invalid event id',
        event: null,
      });
    }
    const userId = (client as any).userId;
    const userType = (client as any).userType;
    const decodedUser: DecodedUser = {
      id: userId,
      userType,
      isGuest: userType === UserTypes.GUEST,
      email: '',
      role: '',
      name: '',
      token: '',
      profilePhoto: '',
      isBusiness: userType === UserTypes.BUSINESS,
    };
    const result = await this.authService.getEventCardView(
      eventId,
      decodedUser,
      body,
    );
    client.emit('getEventDetailsResponse', {
      message: result.message,
      event: result.event,
    });
  }
}
