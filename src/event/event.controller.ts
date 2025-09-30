import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  UploadedFiles,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UserGuard } from 'src/auth/guards/user.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { BusinessProfileGuard } from 'src/auth/guards/business.guard';
import { PublishEventDto } from './dto/publishEvent.dto';
import { PostToSocialMediaDto } from './dto/postToSocialMedia.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import mongoose from 'mongoose';
import { InviteEventDto } from './dto/invite-event.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { ReportEventDto } from './dto/report-event.dto';
import { UpdateCrawledEventDto } from './dto/update-crawled-event.dto';
import { PublishCrawledEventDto } from './dto/publish-crawled-event.dto';
import { SavedEventsDto } from './dto/saved-events.dto';
import { GenerateEventUrlDto } from './dto/generate-event-url.dto';
import { RespondRsvp } from './dto/rsvp-response.dto';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { EventService2 } from './event.service2';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { AdminGuard2 } from 'src/auth/guards2/admin2.guard';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { BadRequestError } from 'openai';
import { RateLimitGuard } from 'src/auth/guards/rateLimiter.guard';
import { PinDropDto } from './dto/pinDrop.dto';
import { UpdatePinDropDto } from './dto/update-pindrop.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SubscriptionGuard } from 'src/subscription/guards/subscription.guard';
import { FeatureLimitList } from 'src/subscription/models/feature-limit.model';

@Controller('event')
export class EventController {
  constructor(
    private readonly eventService: EventService2,
    // private readonly eventService: EventService
  ) {}

  @Post()
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FilesInterceptor(
      'images',
      5,
      // {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 1 MB
      //   limits: { fileSize: 1000000 },
      // }
    ),
  )
  async create(
    @Body() body: CreateEventDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const result = await this.eventService.create(body, user, images);
    if (result.success) {
      return {
        message: result.message,
        event: result.event,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('generateEventUrl')
  @UseGuards(JwtGuard2)
  async generateEventUrl(@Body() generateEventUrlDto: GenerateEventUrlDto) {
    const result =
      await this.eventService.generateEventUrl(generateEventUrlDto);
    if (result.success) {
      return {
        message: result.message,
        eventUrl: result.eventUrl,
      };
    } else {
      return {
        message: result.message,
      };
    }
  }

  @Post('update/:id')
  //  @UseGuards(SubscriptionGuard(FeatureLimitList.LOCATIONS))
  @UseGuards(JwtGuard2)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.updateEvent(
      id,
      updateEventDto,
      user,
    );
    if (result.success) {
      return {
        message: result.message,
        event: result.event,
      };
    } else {
      return {
        message: result.message,
      };
    }
  }

  @Delete('image/:id')
  @UseGuards(JwtGuard)
  async removeImage(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.deleteImage(id, user);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('images/add/:eventId')
  @UseGuards(JwtGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  async addImage(
    @Param('eventId') eventId: string,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const result = await this.eventService.addImages(eventId, user, images);
    if (result.success) {
      return {
        message: result.message,
        event: result.event,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('created')
  @UseGuards(JwtGuard2)
  async getCreatedEvents(
    @Query('page') pageNo: string,
    @Query('limit') limitCount: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const page = pageNo ? parseInt(pageNo) : 1;
    const limit = limitCount ? parseInt(limitCount) : 100;
    const result = await this.eventService.getCreatedEvents(user, page, limit);
    if (result.success) {
      return {
        message: result.message,
        count: result.events.length,
        events: result.events,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('created/v2')
  @UseGuards(JwtGuard2)
  async getCreatedEventsV2(
    @Query('page') pageNo: string,
    @Query('limit') limitCount: string,
    @Query('isExpired') isExpired: string,
    @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('categories') categories: string,
    @Query('locations') locations: string,
    @Query('type') type: string,
    @Query('search') search: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    let expired = false;
    // if (!isExpired) {
    //   throw new BadRequestException({
    //     message: 'Please provide isExpired query parameter',
    //   });
    // } else {
    //   if (isExpired != 'true' && isExpired != 'false') {
    //     throw new BadRequestException({
    //       message: 'Please provide a valid value for isExpired query parameter',
    //     });
    //   }
    //   if (isExpired == 'true') {
    //     expired = true;
    //   } else {
    //     expired = false;
    //   }
    // }
    if (status && status === 'expired') {
      expired = true;
    }
    let categoryIds = null;
    if (categories && categories !== '') {
      categoryIds = categories.split(',');
    }
    let locationIds = null;
    if (locations && locations !== '') {
      locationIds = locations.split(',');
    }

    const page = pageNo ? parseInt(pageNo) : 1;
    const limit = limitCount ? parseInt(limitCount) : 100;
    const result = await this.eventService.contentManagement(
      user,
      expired,
      page,
      limit,
      status,
      startDate,
      endDate,
      categoryIds,
      locationIds,
      type,
      search,
    );
    if (result.success) {
      return {
        message: result.message,
        events: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('created/:id')
  @UseGuards(JwtGuard2)
  async getCreatedEvent(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.getCreatedEvent(id, user);
    if (result.success) {
      return {
        message: result.message,
        event: result.event,
        eventStartsIn: result.eventStartsIn,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  // @Get('crawled')
  // @UseGuards(AdminGuard2)
  // async getCrawledEvents(
  //   @Query('page') page: string,
  //   @Query('limit') limit: string,
  //   @Query('status') status: string,
  // ) {
  //   if (!page || page == '') {
  //     page = '1';
  //   }
  //   if (!limit || limit == '') {
  //     limit = '10';
  //   }
  //   if (!status || status == '') {
  //     status = 'all';
  //   }
  //   const result = await this.eventService.getCrawledEvents(
  //     parseInt(page),
  //     parseInt(limit),
  //     status,
  //   );
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       count: result.count,
  //       events: result.crawledEvents,
  //       pages: result.pages,
  //       page: result.page,
  //     };
  //   } else {
  //     throw new BadRequestException({
  //       message: result.message,
  //     });
  //   }
  // }

  // @Delete('crawled/:id')
  // @UseGuards(AdminGuard2)
  // async removeCrawledEvent(@Param('id') id: string) {
  //   if (!mongoose.isValidObjectId(id)) {
  //     throw new BadRequestException({
  //       message: 'Invalid event id',
  //     });
  //   }
  //   const result = await this.eventService.deleteCrawledEvent(id);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //     };
  //   } else {
  //     throw new BadRequestException({
  //       message: result.message,
  //     });
  //   }
  // }

  // @Post('crawled/edit/:id')
  // @UseGuards(AdminGuard2)
  // async updateCrawledEvent(
  //   @Param('id') id: string,
  //   @Body() body: UpdateCrawledEventDto,
  // ) {
  //   if (!mongoose.isValidObjectId(id)) {
  //     throw new BadRequestException({
  //       message: 'Please provide a valid id',
  //     });
  //   }
  //   const result = await this.eventService.updateCrawledEvent(id, body);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       event: result.event,
  //     };
  //   } else {
  //     throw new BadRequestException({
  //       message: result.message,
  //     });
  //   }
  // }

  // @Post('crawled/publish')
  // @UseGuards(AdminGuard2)
  // async publishCrawledEvent(@Body() body: PublishCrawledEventDto) {
  //   body.ids.forEach((id) => {
  //     if (!mongoose.isValidObjectId(id)) {
  //       throw new BadRequestException({
  //         message: `Please provide a valid id for ${id}`,
  //       });
  //     }
  //   });
  //   if (!mongoose.isValidObjectId(body.businessProfile)) {
  //     throw new BadRequestException({
  //       message: 'Please provide a valid business id',
  //     });
  //   }
  //   if (!mongoose.isValidObjectId(body.user)) {
  //     throw new BadRequestException({
  //       message: 'Please provide a valid user id',
  //     });
  //   }
  //   const result = await this.eventService.publishCrawledEvent(body);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       data: result.data,
  //     };
  //   } else {
  //     throw new BadRequestException({
  //       message: result.message,
  //     });
  //   }
  // }

  @Post('update/image/:id')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor(
      'image',
      // , {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 1 MB
      //   limits: { fileSize: 1000000 },
      // }
    ),
  )
  async updateImage(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const result = await this.eventService.updateEventImage(id, user, image);
    if (result.success) {
      return {
        message: result.message,
        image: result.image,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('publish/toggle')
  // @UseGuards(SubscriptionGuard(FeatureLimitList.CONTENT_CREATION))
  @UseGuards(JwtGuard2)
  async togglePublishEvent(
    @Body() body: PublishEventDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.togglePublishEvent(body, user);
    if (result.success) {
      return {
        message: result.message,
        status: result.status,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('invitation')
  @UseGuards(JwtGuard2)
  async createInvitation(
    @TokenDecoder() user: DecodedUser,
    @Body() body: InviteEventDto,
  ) {
    if (!mongoose.isValidObjectId(body.event)) {
      throw new BadRequestException({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.createInvitation(body, user);
    if (result.success) {
      return {
        message: result.message,
        invitation: result.invitation,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('accept/invitation')
  @UseGuards(JwtGuard2)
  async acceptInvitation(
    @TokenDecoder() user: DecodedUser,
    @Body() body: AcceptInvitationDto,
  ) {
    if (!mongoose.isValidObjectId(body.id)) {
      throw new BadRequestException({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.acceptInvitation(body, user);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('decline/invitation/:id')
  @UseGuards(JwtGuard2)
  async declineInvitation(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.declineInvitation(id, user);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('rsvp/response/:id')
  @UseGuards(JwtGuard2)
  async rsvpResponse(
    @Body() body: RespondRsvp,
    @Param('id') eventId: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(eventId)) {
      throw new BadRequestException({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.rsvpResponse(
      user.id,
      eventId,
      body.rsvp,
    );
    if (result.success) {
      return {
        message: result.message,
        rsvp: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('rsvp/:id')
  @UseGuards(JwtGuard2)
  async getRsvp(
    @Param('id') eventId: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(eventId)) {
      throw new BadRequestException({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.getEventRsvp(eventId, user);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('social/post')
  @UseGuards(BusinessProfileGuard)
  async socialPost(
    // @Res() res: Response,
    @Body() body: PostToSocialMediaDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.postToSocialMedia(
      user.businessProfile,
      body,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('templates')
  @UseGuards(JwtGuard2)
  async getTemplates(@TokenDecoder() user: DecodedUser) {
    const result = await this.eventService.getTemplates(user);
    if (result.success) {
      return {
        message: result.message,
        events: result.templates,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Get('templates/seeded')
  @UseGuards(JwtGuard2)
  async getDefaultTemplates(
    @TokenDecoder() user: DecodedUser,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.eventService.getDefaultTemplates(
      user,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('template/:id')
  @UseGuards(JwtGuard2)
  async getTemplate(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.getTemplate(id, user);
    if (result.success) {
      return {
        message: result.message,
        event: result.template,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Delete('template/:id')
  @UseGuards(JwtGuard2)
  async removeTemplate(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.deleteTemplate(id, user);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  // @Post('close/:id')
  // @UseGuards(JwtGuard)
  // async closeEvent(@Param('id') id: string, @TokenDecoder() user: DecodedUser) {
  //   const result = await this.eventService.closeEvent(id, user);
  //   if (result.success) {
  //     return {
  //       message: result.message,
  //       status: result.status,
  //     };
  //   } else {
  //     throw new BadRequestException({
  //       message: result.message,
  //     });
  //   }
  // }

  @Post('copy/:id')
  @UseGuards(JwtGuard2)
  async copyEvent(
    @Param('id') id: string,
    @Query('isExpired') isExpired: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    let expired = false;
    if (isExpired == 'true') {
      expired = true;
    }
    const result = await this.eventService.copyEvent(id, user, expired);
    if (result.success) {
      return {
        message: result.message,
        event: result.event,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('save/toggle')
  @UseGuards(JwtGuard2)
  async toggleSaveEvent(
    @Body() body: { eventId: string },
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.toggleSaveEvent(
      body.eventId,
      user.id,
    );
    if (result.success) {
      return {
        message: result.message,
        saved: result.saved,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Patch('like/toggle/:id')
  @UseGuards(JwtGuard2)
  async likeEvent(
    @Param('id') eventId: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.likeEvent(eventId, user.id);
    if (result.success) {
      return {
        message: result.message,
        liked: result.liked,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('saved')
  @UseGuards(JwtGuard2)
  async getSavedEvents(
    // @Body() body: SavedEventsDto,
    @TokenDecoder() user: DecodedUser,
    @Query('type') type: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
  ) {
    if (!type || type == '') {
      type = 'all';
    }
    if (!page) {
      page = '1';
    }
    if (!limit || limit == '') {
      limit = '10';
    }
    const result = await this.eventService.getSavedEvents(
      user.id,
      type,
      latitude ? parseFloat(latitude) : 0,
      longitude ? parseFloat(longitude) : 0,
      parseInt(page),
      parseInt(limit),
    );
    if (result.success) {
      return {
        message: result.message,
        events: result.data.events,
        // offers: result.data.offers,
        // privateEvents: result.data.privateEvents,
        liked: result.data.liked,
        reported: result.data.reported,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Get('liked')
  @UseGuards(JwtGuard2)
  async getLikedEvents(
    @TokenDecoder() user: DecodedUser,
    @Body() body: SavedEventsDto,
    @Query('type') type: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    if (!type || type == '') {
      type = 'all';
    }
    if (!page || page == '') {
      page = '1';
    }
    if (!limit || limit == '') {
      limit = '10';
    }
    const result = await this.eventService.getLikedEvents(
      user.id,
      type,
      body.latitude ? parseInt(body.latitude) : 0,
      body.longitude ? parseInt(body.longitude) : 0,
      parseInt(page),
      parseInt(limit),
    );
    if (result.success) {
      return {
        message: result.message,
        events: result.events,
        pages: result.pages,
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Delete(':id')
  @UseGuards(JwtGuard2)
  async remove(@Param('id') id: string, @TokenDecoder() user: DecodedUser) {
    const result = await this.eventService.deleteEvent(id, user);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('reportTypes')
  @UseGuards(RateLimitGuard)
  async getReportTypes() {
    const result = await this.eventService.getReportTypes();
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('report')
  @UseGuards(JwtGuard2)
  async reportEvent(
    @Body() body: ReportEventDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.reportEvent(user.id, body);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('reports')
  @UseGuards(JwtGuard2)
  async getReports(
    @TokenDecoder() user: DecodedUser,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.eventService.getReports(
      user.id,
      pageNumber,
      limitNumber,
      latitude ? parseFloat(latitude) : 0,
      longitude ? parseFloat(longitude) : 0,
    );
    if (result.success) {
      return {
        message: result.message,
        reports: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Post('schedule/:id')
  @UseGuards(JwtGuard2)
  async createSchedule(
    @Param('id') id: string,
    @Body() data: CreateScheduleDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.createSchedule(id, data, user);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Put('schedule/:id')
  @UseGuards(JwtGuard2)
  async updateSchedule(
    @Param('id') id: string,
    @Query('eventId') eventId: string,
    @Body() data: CreateScheduleDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.editSchedule(
      id,
      eventId,
      user.id,
      data,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Delete('schedule/:id')
  @UseGuards(JwtGuard2)
  async deleteSchedule(
    @Param('id') id: string,
    @Query('eventId') eventId: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.deleteSchedule(id, eventId);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('offer')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('image', {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 1 MB
      limits: { fileSize: 1000000 },
    }),
  )
  async createOffer(
    @Body() data: CreateOfferDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() image: Express.Multer.File,
  ) {
    console.log('Creating offer with data:', data);
    const result = await this.eventService.createOffer(data, user, image);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Get('business/created')
  @UseGuards(JwtGuard2)
  async businessDownlineEventsList(
    @Query('page') pageNo: string,
    @Query('limit') limitCount: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const page = pageNo ? parseInt(pageNo) : 1;
    const limit = limitCount ? parseInt(limitCount) : 100;
    const result = await this.eventService.businessDownlineEventsList(
      user,
      page,
      limit,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.event,
        totalViews: result.totalViews,
        totalEngagements: result.totalEngagements,
        statusCount: result.statusCount,
        total: result.total,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Post('crawlEvents')
  @UseGuards(AdminGuard2)
  async crawlEvents() {
    const result = await this.eventService.crawlEvents();
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Post('ETL')
  @UseGuards(AdminGuard2)
  @UseInterceptors(
    FileInterceptor('file', {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 10 MB
      limits: { fileSize: 10000000 },
    }),
  )
  async ETL(user: DecodedUser, @UploadedFile() file: Express.Multer.File) {
    const result = await this.eventService.ETL_TRANSFORMER(user.id, file);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('saveTemplate')
  @UseGuards(JwtGuard2)
  async saveTemplate(
    @Body() body: PublishEventDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.saveTemplate(body, user);
    if (result.success) {
      return {
        message: result.message,
        status: result.status,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Put('offer/:id')
  // @UseGuards(SubscriptionGuard(FeatureLimitList.LOCATIONS))
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('image', {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 1 MB
      limits: { fileSize: 10485760 },
    }),
  )
  async updateOffer(
    @Param('id') id: string,
    @Body() body: UpdateOfferDto,
    @TokenDecoder() user: DecodedUser,
      @UploadedFile() image: Express.Multer.File,
  ) {
    console.log('Updating offer with ID:', id);
    console.log('Body::', body);
    const result = await this.eventService.updateOffer(id, body, user, image);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('update/location/:id')
  @UseGuards(JwtGuard2)
  async updateEventLocations(
    @Param('id') id: string,
    @Body('locations') locations: string[], 
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.updateEventLocations(
      id,
      locations,
      user,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('pinDrop')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 50 * 1024 * 1024 }, // ✅ Set file size limit to 50MB
    }),
  )
  async createPinDropEvent(
    @Body() data: CreateOfferDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    if (images.length < 1) {
      throw new BadRequestException({
        message: 'Please upload at least one image',
      });
    }
    const result = await this.eventService.createPinDropEvent(
      data,
      user,
      images,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
  @Post('pinDrop/:id')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 50 * 1024 * 1024 }, // ✅ Set file size limit to 50MB
    }),
  )
  async updatePinDropEvent(
    @Param('id') id: string,
    @Body() data: UpdatePinDropDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const result = await this.eventService.updatePinDropEvent(
      id,
      data,
      user,
      images,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('pinDrop/location/:id')
  @UseGuards(JwtGuard2)
  async pinDrop(
    @Param('id') id: string,
    @Body() data: PinDropDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.pinDrop(id, user, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('template')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('image', {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 1 MB
      limits: { fileSize: 1000000 },
    }),
  )
  async createTemplate(
    @Body() data: CreateTemplateDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const result = await this.eventService.createTemplate(user, data, image);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Patch('template/:id')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('image', {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 1 MB
      limits: { fileSize: 1000000 },
    }),
  )
  async editTemplate(
    @Param('id') id: string,
    @Body() data: Partial<CreateTemplateDto>,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const result = await this.eventService.editTemplate(id, user, data, image);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }
}
