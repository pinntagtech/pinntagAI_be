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
  Res,
  UploadedFile,
  HttpStatus,
  Query,
  UploadedFiles,
  Req,
  Put,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UserGuard } from 'src/auth/guards/user.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
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
import { AdminGuard } from 'src/auth/guards/admin.guard';
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
    @Res() res: Response,
    @Body() body: CreateEventDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const result = await this.eventService.create(body, user, images);
    if (result.success) {
      return res.status(HttpStatus.CREATED).json({
        message: result.message,
        event: result.event,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
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
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.deleteImage(id, user);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
  }

  @Post('images/add/:eventId')
  @UseGuards(JwtGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  async addImage(
    @Res() res: Response,
    @Param('eventId') eventId: string,
    @TokenDecoder() user: DecodedUser,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const result = await this.eventService.addImages(eventId, user, images);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        event: result.event,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('created')
  @UseGuards(JwtGuard2)
  async getCreatedEvents(
    @Query('page') pageNo: string,
    @Query('limit') limitCount: string,
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const page = pageNo ? parseInt(pageNo) : 1;
    const limit = limitCount ? parseInt(limitCount) : 100;
    const result = await this.eventService.getCreatedEvents(user, page, limit);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        count: result.events.length,
        events: result.events,
        pages: result.pages,
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
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
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    let expired = false;
    if (!isExpired) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide isExpired query parameter',
      });
    } else {
      if (isExpired != 'true' && isExpired != 'false') {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Please provide a valid value for isExpired query parameter',
        });
      }
      if (isExpired == 'true') {
        expired = true;
      } else {
        expired = false;
      }
    }
    const page = pageNo ? parseInt(pageNo) : 1;
    const limit = limitCount ? parseInt(limitCount) : 100;
    const result = await this.eventService.contentManagement(
      user,
      expired,
      page,
      limit,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // count: result.events.length,
        events: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('created/:id')
  @UseGuards(JwtGuard2)
  async getCreatedEvent(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.getCreatedEvent(id, user);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        event: result.event,
        eventStartsIn: result.eventStartsIn,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('crawled')
  @UseGuards(AdminGuard)
  async getCrawledEvents(
    @Res() res: Response,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: string,
  ) {
    if (!page || page == '') {
      page = '1';
    }
    if (!limit || limit == '') {
      limit = '10';
    }
    if (!status || status == '') {
      status = 'all';
    }
    const result = await this.eventService.getCrawledEvents(
      parseInt(page),
      parseInt(limit),
      status,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        count: result.count,
        events: result.crawledEvents,
        pages: result.pages,
        page: result.page,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Delete('crawled/:id')
  @UseGuards(AdminGuard)
  async removeCrawledEvent(@Res() res: Response, @Param('id') id: string) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.deleteCrawledEvent(id);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
  }

  @Post('crawled/edit/:id')
  @UseGuards(AdminGuard)
  async updateCrawledEvent(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UpdateCrawledEventDto,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide a valid id',
      });
    }
    const result = await this.eventService.updateCrawledEvent(id, body);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        event: result.event,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('crawled/publish')
  @UseGuards(AdminGuard)
  async publishCrawledEvent(
    @Res() res: Response,
    @Body() body: PublishCrawledEventDto,
  ) {
    // if (!mongoose.isValidObjectId(body.id)) {
    //   return res.status(HttpStatus.BAD_REQUEST).json({
    //     message: 'Please provide a valid id',
    //   });
    // }
    body.ids.forEach((id) => {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: `Please provide a valid id for ${id}`,
        });
      }
    });
    if (!mongoose.isValidObjectId(body.businessProfile)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide a valid business id',
      });
    }
    if (!mongoose.isValidObjectId(body.user)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide a valid user id',
      });
    }
    const result = await this.eventService.publishCrawledEvent(body);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

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
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const result = await this.eventService.updateEventImage(id, user, image);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        image: result.image,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('publish/toggle')
  @UseGuards(JwtGuard2)
  async togglePublishEvent(
    @Res() res: Response,
    @Body() body: PublishEventDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.togglePublishEvent(body, user);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        status: result.status,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('invitation')
  @UseGuards(JwtGuard)
  async getInvitation(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Body() body: InviteEventDto,
  ) {
    if (!mongoose.isValidObjectId(body.event)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.getEventInvitation(body, user);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        invitation: result.invitation,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('accept/invitation')
  @UseGuards(JwtGuard)
  async acceptInvitation(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Body() body: AcceptInvitationDto,
  ) {
    if (!mongoose.isValidObjectId(body.id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.acceptInvitation(body, user);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
  }

  @Post('decline/invitation/:id')
  @UseGuards(JwtGuard)
  async declineInvitation(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.declineInvitation(id, user);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
  }

  @Post('rsvp/response/:id')
  @UseGuards(JwtGuard)
  async rsvpResponse(
    @Res() res: Response,
    @Body() body: RespondRsvp,
    @Param('id') eventId: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.rsvpResponse(
      user.id,
      eventId,
      body.rsvp,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        rsvp: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('rsvp/:id')
  @UseGuards(JwtGuard)
  async getRsvp(
    @Res() res: Response,
    @Param('id') eventId: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid event id',
      });
    }
    const result = await this.eventService.getEventRsvp(eventId, user);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('social/post')
  @UseGuards(BusinessProfileGuard)
  async socialPost(
    @Res() res: Response,
    @Body() body: PostToSocialMediaDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.postToSocialMedia(
      user.businessProfile,
      body,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('templates')
  @UseGuards(JwtGuard2)
  async getTemplates(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.eventService.getTemplates(user);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        events: result.templates,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Get('templates/seeded')
  @UseGuards(JwtGuard2)
  async getDefaultTemplates(
    @Res() res: Response,
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
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('template/:id')
  @UseGuards(JwtGuard)
  async getTemplate(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.getTemplate(id, user);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        event: result.template,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Delete('template/:id')
  @UseGuards(JwtGuard)
  async removeTemplate(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.deleteTemplate(id, user);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
  }

  @Post('close/:id')
  @UseGuards(JwtGuard)
  async closeEvent(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.closeEvent(id, user);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        status: result.status,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('copy/:id')
  @UseGuards(JwtGuard2)
  async copyEvent(
    @Res() res: Response,
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
      return res.status(HttpStatus.OK).json({
        message: result.message,
        event: result.event,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('save/toggle')
  @UseGuards(JwtGuard2)
  async toggleSaveEvent(
    @Res() res: Response,
    @Body() body: { eventId: string },
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.toggleSaveEvent(
      body.eventId,
      user.id,
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        saved: result.saved,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Patch('like/toggle/:id')
  @UseGuards(JwtGuard2)
  async likeEvent(
    @Res() res: Response,
    @Param('id') eventId: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.likeEvent(eventId, user.id);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        liked: result.liked,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('saved')
  @UseGuards(JwtGuard2)
  async getSavedEvents(
    @Res() res: Response,
    @Body() body: SavedEventsDto,
    @TokenDecoder() user: DecodedUser,
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
    const result = await this.eventService.getSavedEvents(
      user.id,
      type,
      body.latitude ? parseFloat(body.latitude) : 0,
      body.longitude ? parseFloat(body.longitude) : 0,
      // parseInt(page),
      // parseInt(limit),
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('liked')
  @UseGuards(UserGuard)
  async getLikedEvents(
    @Res() res: Response,
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
      // parseInt(page),
      // parseInt(limit),
    );
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        events: result.events,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Delete(':id')
  @UseGuards(JwtGuard2)
  async remove(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.deleteEvent(id, user);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
  }

  @Post('report')
  @UseGuards(JwtGuard)
  async reportEvent(
    @Res() res: Response,
    @Body() body: ReportEventDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.reportEvent(user.id, body);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
  }

  @Get('reports')
  @UseGuards(JwtGuard)
  async getReports(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.eventService.getReports(user.id);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        reports: result.reports,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Post('schedule/:id')
  @UseGuards(JwtGuard2)
  async createSchedule(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() data: CreateScheduleDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.createSchedule(id, data, user);
    if (result.success) {
      return res.status(HttpStatus.CREATED).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Put('schedule/:id')
  @UseGuards(JwtGuard2)
  async updateSchedule(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('eventId') eventId: string,
    @Body() data: CreateScheduleDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.editSchedule(id,eventId,user.id,data);
    if (result.success) {
      return res.status(HttpStatus.CREATED).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Delete('schedule/:id')
  @UseGuards(JwtGuard2)
  async deleteSchedule(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('eventId') eventId: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.eventService.deleteSchedule(id, eventId);
    if (result.success) {
      return res.status(HttpStatus.CREATED).json({
        message: result.message,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
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
    @Res() res: Response,
    @Body() data: CreateOfferDto,
    @TokenDecoder() user: DecodedUser,
    @UploadedFile() image: Express.Multer.File,
  ) {
    console.log('controller image:', image);
    // if(!image){
    //   return res.status(HttpStatus.BAD_REQUEST).json({
    //     message: 'Please provide an image',
    //   });
    // }
    const result = await this.eventService.createOffer(data, user, image);
    if (result.success) {
      return res.status(HttpStatus.CREATED).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('business/created')
  @UseGuards(JwtGuard2)
  async businessDownlineEventsList(
    @Query('page') pageNo: string,
    @Query('limit') limitCount: string,
    @Res() res: Response,
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
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.event,
        totalViews: result.totalViews,
        totalEngagements: result.totalEngagements,
        statusCount: result.statusCount,
        total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Post('crawlEvents')
  @UseGuards(AdminGuard2)
  async crawlEvents(@Res() res: Response) {
    const result = await this.eventService.crawlEvents();
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
}
