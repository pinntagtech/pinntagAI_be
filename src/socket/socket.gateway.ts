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
import {
  BusinessUser,
  BusinessUserDocument,
} from '../business/model/businessUser.model';
import { Admin, AdminDocument } from '../admin/models/admin.model';
import { GetDashboardDto } from '../auth/dto/getDashboard.dto';
import { Type } from 'class-transformer';
import { BusinessService } from 'src/business/business.service';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  // namespace: '/dashboard-socket',
  path: '/socket.io',
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
    private readonly businessService: BusinessService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    // private readonly logger: Logger,
  ) {}

  afterInit() {
    this.server.use((socket: Socket, next) => {
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
        next();
      } catch (err) {
        return next(new Error('Authentication error'));
      }
    });
  }

  async handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
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
      // this.logger.error('Connection Error:', err);
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
    // this.logger.log(`Client ${userId} disconnected`);
  }

  @SubscribeMessage('getDashboardAllConfigs')
  async handleGetDashboardAllConfigs(
    client: Socket,
    payload: { carouselType: string },
  ) {
     const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const result = await this.authService.getDashboardAllConfigs(
      data.data.carouselType,
    );
    client.emit('successMessage', 'Dashboard configs fetched successfully');
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
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const { body, carouselId, search, distance, timeZone } = data.data;
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
    console.log('Decoded User:', decodedUser);
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
      body.industries ? body.industries : null,
      body.isFollowedByMe ? body.isFollowedByMe : null,

    );
    client.emit('getDashboardCarouselEvent2Response', {
      message: result.message,
      eventsResult: result.data,
    });
  }

  @SubscribeMessage('dashboardMapView')
  async handleDashboardMapView(
    client: Socket,
    payload: {
      body: GetDashboardDto;
      carouselId: string;
      search?: string;
      page?: string;
      limit?: string;
      distance?: string;
      timeZone?: string;
    },
  ) {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const { body, carouselId, search, page, limit, distance, timeZone } =
      data.data;
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
    const result = await this.authService.getDashboardMapView(
      decodedUser,
      carouselId,
      parseFloat(body.latitude),
      parseFloat(body.longitude),
      distance ? parseInt(distance) : 1000000000000,
      search ? search : '',
      timeZone ? timeZone : 'America/Chicago',
      limit ? parseInt(limit) : 15,
      page ? parseInt(page) : 1,
      body.categories ? body.categories : [],
      body.startDate ? new Date(body.startDate) : null,
      body.endDate ? new Date(body.endDate) : null,
    );
    client.emit('dashboardMapViewResponse', {
      message: result.message,
      events: result.events,
      page: result.page,
      limit: result.limit,
      total: result.totalCount,
      pages: result.pages,
    });
  }

  @SubscribeMessage('getEventDetails')
  async handleGetEventDetails(
    client: Socket,
    payload: { body: GetDashboardDto; eventId: string },
  ) {
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

    const { body, eventId } = data.data;
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

  @SubscribeMessage('businessCardView')
  async handleBusinessCardView(
    client: Socket,
    payload: { businessId: string, latitude: number, longitude: number }
  ){
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const { businessId, latitude, longitude } = data.data;
    if (!isValidObjectId(businessId)) {
      return client.emit('businessCardViewResponse', {
        message: 'Invalid business id',
        business: null,
      });
    }
    const userId = (client as any).userId;
    const result = await this.businessService.fetchBusiness(
      businessId,
      userId,
      parseFloat(latitude),
      parseFloat(longitude)
    );
    client.emit('businessCardViewResponse', {
      message: result.message,
      data: result.data,
    });
  }
}
