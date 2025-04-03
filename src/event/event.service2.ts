import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Event, EventDocument } from './models/event.model';
import mongoose, { Model } from 'mongoose';
import axios from '@nestjs/axios';
import { Category, CategoryDocument } from 'src/models/category.model';
import { Image, ImageDocument } from './models/image.model';
import { User, UserDocument } from 'src/user/models/user.model';
import {
  BadWords,
  CrawledEventStatus,
  EventStatus,
  EventTypes,
  NotificationTypes,
  RSVPTypes,
} from 'src/enums/event.enums';
import { S3Service } from 'src/s3.service';
import { PublishEventDto } from './dto/publishEvent.dto';
import { Template, TemplateDocument } from './models/template.model';
import { PostToSocialMediaDto } from 'src/event/dto/postToSocialMedia.dto';
import { FacebookService } from 'src/user/facebook.service';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from 'src/business-profile/models/businessProfile.model';
import { HttpService } from '@nestjs/axios';
import { Request } from 'node-fetch';
import {
  EventLocation,
  EventLocationDocument,
} from './models/eventLocation.model';
import {
  BusinessLocation,
  BusinessLocationDocument,
} from 'src/business-profile/models/businessLocation.model';
import {
  Notification,
  NotificationDocument,
} from 'src/notification/models/notification.model';
import { Follow, FollowDocument } from 'src/user/models/follow.model';
import { UserService } from 'src/user/user.service';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { Location } from 'src/business-profile/models/types.model';
import {
  BusinessPopulates,
  CategoryPopulates,
  ExmpLocKeys,
  ImagePopulates,
  LocationPopulates,
  UserPopulates,
} from 'src/enums/user.enum';
import {
  EventInvitation,
  EventInvitationDocument,
} from './models/eventInvitation.model';
import { InviteEventDto } from './dto/invite-event.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { Report, ReportDocument } from './models/reports.model';
import { ReportEventDto } from './dto/report-event.dto';
import {
  currentDateTz,
  getStringDateTz,
  getStringDateTzWithTime,
  getZeroDateTz,
  haversineDistance,
} from 'src/helpers/event.helpers';
import { start } from 'repl';
import { AgeGroup, AgeGroupDocument } from 'src/models/ageGroup.model';
import {
  Subscription,
  SubscriptionDocument,
} from 'src/subscription/models/subscription.model';
import {
  CrawledEvent,
  CrawledEventDocument,
} from './models/crawled-event.model';
import { UpdateCrawledEventDto } from './dto/update-crawled-event.dto';
import { PublishCrawledEventDto } from './dto/publish-crawled-event.dto';
import { FirebaseService } from 'src/notification/firebase.service';
import { Token, TokenDocument } from 'src/auth/models/token.model';
import { TokenTypes, UserTypes } from 'src/enums/auth.enums';
import { firstValueFrom, from } from 'rxjs';
import { DynamicLinkService } from 'src/notification/dynamicLink.service';
import { GenerateEventUrlDto } from './dto/generate-event-url.dto';
import { extname } from 'path';
import { manipulateImageName } from 'src/helpers/upload.helpers';
import {
  EventResponse,
  EventResponseDocument,
} from './models/event-response.model';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import {
  EventSchedule,
  EventScheduleDocument,
  FixedSchedule,
  ScheduleTypes,
} from './models/event-schedule.model';
import { Outlet, OutletDocument } from 'src/outlet/model/outlet.model';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class EventService2 {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Image.name)
    private readonly imageModel: Model<ImageDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    // @InjectModel(BusinessProfile.name)
    // private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(Business.name)
    private readonly businessProfileModel: Model<BusinessDocument>,
    @InjectModel(AgeGroup.name)
    private readonly ageGroupModel: Model<AgeGroupDocument>,
    @InjectModel(EventLocation.name)
    private readonly eventLocationModel: Model<EventLocationDocument>,
    @InjectModel(BusinessLocation.name)
    private readonly businessLocationModel: Model<BusinessLocationDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    @InjectModel(EventInvitation.name)
    private eventInvitationModel: Model<EventInvitationDocument>,
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(CrawledEvent.name)
    private readonly crawledEventModel: Model<CrawledEventDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(EventResponse.name)
    private readonly eventResponseModel: Model<EventResponseDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(EventSchedule.name)
    private readonly scheduleModel: Model<EventScheduleDocument>,
    @InjectModel(Outlet.name)
    private readonly outletModel: Model<OutletDocument>,
    @InjectModel(BusinessUser.name) private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(EventSchedule.name) private readonly eventScheduleModel: Model<EventScheduleDocument>,
    private readonly s3Service: S3Service,
    private readonly userService: UserService,
    private readonly facebookService: FacebookService,
    private readonly httpService: HttpService,
    private readonly firebaseService: FirebaseService,
    private readonly dynamicLinkService: DynamicLinkService,
  ) {}
  async create(
    createEventDto: CreateEventDto,
    user: DecodedUser,
    images: Express.Multer.File[],
  ) {
    const userId = user.id;
    if (!user.isBusiness && createEventDto.type != EventTypes.PRIVATE) {
      return {
        success: false,
        message: 'You are authorized just to create private events',
      };
    }
    if (createEventDto.keywords) {
      let legalKeywords = [];
      // createEventDto.keywords = JSON.parse(createEventDto.keywords.toString());
      createEventDto.keywords = createEventDto.keywords.split(',');
      for (const keyword of createEventDto.keywords) {
        if (!BadWords.includes(keyword.toLowerCase())) {
          legalKeywords.push(keyword);
        }
      }
      createEventDto.keywords = legalKeywords;
    }

    // const createdEvents = await this.eventModel.find({
    //   createdBy: new mongoose.Types.ObjectId(user.id),
    // });
    // const userDoc = await this.userModel.findById(userId);
    // if (
    //   !userDoc.hasSubscribedForBusiness &&
    //   userDoc.isBusiness &&
    //   createdEvents.length > 0
    // ) {
    //   return {
    //     success: false,
    //     message:
    //       'You have already created an event. Please subscribe to create more events.',
    //   };
    // }
    //  createEventDto.category.forEach((category) =>
    if (createEventDto.categories) {
      let categoriesInObjectId = [];
      createEventDto.categories = createEventDto.categories.split(',');
      for (let category of createEventDto.categories) {
        if (!mongoose.isValidObjectId(category)) {
          return {
            success: false,
            message: 'Please provide a valid category id',
          };
        }
        const foundCategory = await this.categoryModel.findById(category);
        if (!foundCategory) {
          return {
            success: false,
            message: 'Category not found',
          };
        }
        categoriesInObjectId.push(new mongoose.Types.ObjectId(category));
      }
      createEventDto.categories = categoriesInObjectId;
    }
    let createQuery = {
      ...createEventDto,
      //   creatorType: user.isBusiness ? BusinessProfile.name : User.name,
      creatorType: user.isBusiness ? BusinessUser.name : User.name,
      user: new mongoose.Types.ObjectId(user.id),
    };

    if (user.isBusiness) {
      createQuery['businessProfile'] = new mongoose.Types.ObjectId(
        user.businessProfile,
      );
    }
    const event = await this.eventModel.create(createQuery);
    const eventImages = [];
    for (let i = 0; i < images.length; i++) {
      const result = await this.s3Service.s3_upload(
        images[i].buffer,
        process.env.AWS_S3_BUCKET_NAME,
        manipulateImageName(images[i].originalname),
        'image/jpeg',
      );
      const image = await this.imageModel.create({
        url: result.Location,
        event: event._id,
      });
      eventImages.push(image._id);
    }
    let eventResult = await this.eventModel
      .findByIdAndUpdate(
        event._id,
        {
          $set: {
            images: eventImages,
          },
        },
        { new: true },
      )
      .populate('images', ImagePopulates.FOREIGN)
      .populate({
        path: 'categories',
        select: '_id name image color',
      });
    // if (event.type == EventTypes.PRIVATE) {
    //   await this.eventModel.findByIdAndUpdate(event._id, {
    //     $push: { participants: new mongoose.Types.ObjectId(user.id) },
    //   });
    // }

    // try {
    //   const eventUrl = `${process.env.EVENT_BASE_URL}${event._id.toString()}`;
    //   // const result = await this.shortenUrl(eventUrl);
    //   const result = await this.dynamicLinkService.generateShortLink(eventUrl, {
    //     title: eventResult.title,
    //     description: eventResult.description,
    //     imageUrl: (eventResult.images[0] as any)?.url || '',
    //   });
    //   const { shortLink } = result;
    //   await this.eventModel.findByIdAndUpdate(
    //     event._id,
    //     {
    //       $set: {
    //         eventUrl: shortLink,
    //       },
    //     },
    //     { new: true },
    //   );
    //   eventResult.eventUrl = shortLink;
    // } catch (err) {
    //   console.log('url shortner error: ', err);
    // }

    return {
      success: true,
      message: 'Event created successfully',
      event: eventResult,
    };
  }

  async shortenUrl(longUrl: string) {
    const res = await firstValueFrom(
      this.httpService.post(
        `${process.env.URL_SHORTNER_API_URL}/rest/v3/short-urls`,
        {
          longUrl,
        },
        {
          headers: {
            'X-Api-Key': process.env.URL_SHORTNER_API_KEY,
          },
        },
      ),
    );
    return res.data?.shortUrl;
  }

  async generateEventUrl({
    title,
    description,
    imageUrl,
    eventId,
  }: GenerateEventUrlDto) {
    if (!mongoose.isValidObjectId(eventId)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
        eventUrl: undefined,
      };
    }
    const successResponse = {
      success: true,
      message: 'eventUrl successfully generated',
      eventUrl: '',
      eventDescription: '${title} by ${eventId} brought to you by PinnTag.',
    };

    const eventInfo = await this.eventModel.findById(eventId);
    let businessName = '';
    if (eventInfo.creatorType === BusinessProfile.name) {
      const businessProfile = await this.businessProfileModel.findById(
        eventInfo.businessProfile,
      );
      businessName = businessProfile.name;
    } else {
      const user = await this.userModel.findById(eventInfo.user);
      businessName = user.name;
    }
    const eventUrl = `${process.env.EVENT_BASE_URL}${eventId.toString()}`;
    let eventDescription = '';
    let requiredSchedule;
    //fetch the schedule whose date is greater than or equal to the current date

    for (let i = 0; i < eventInfo.schedule.length; i++) {
      if (!requiredSchedule) {
        if (eventInfo.schedule[i].date >= new Date()) {
          // requiredSchedule = eventInfo.schedule[i];
          for (let j = 0; j < eventInfo.schedule[i].durations.length; j++) {
            if (eventInfo.schedule[i].durations[j].startTime >= new Date()) {
              requiredSchedule = eventInfo.schedule[i].durations[j].startTime;
              break;
            }
          }
        }
      }
    }
    if (eventInfo.schedule.length == 1) {
      eventDescription = getStringDateTzWithTime(requiredSchedule);
    } else {
      eventDescription = `${getStringDateTzWithTime(requiredSchedule)} (plus more)`;
    }
    const result = await this.dynamicLinkService.generateShortLink(eventUrl, {
      title,
      description: eventDescription,
      imageUrl,
      businessName,
    });
    const { shortLink } = result;
    await this.eventModel.findByIdAndUpdate(eventId, {
      $set: {
        eventUrl: shortLink,
      },
    });
    successResponse.eventUrl = shortLink;

    // if (eventInfo.eventUrl) {
    //   console.log(`IS it working ${eventInfo}`);
    //   successResponse.eventUrl = eventInfo.eventUrl;
    // } else {
    //   const eventUrl = `${process.env.EVENT_BASE_URL}${eventId.toString()}`;
    //   const result = await this.dynamicLinkService.generateShortLink(eventUrl, {
    //     title: title,
    //     description: description,
    //     imageUrl: imageUrl,
    //   });
    //   const { shortLink } = result;
    //   await this.eventModel.findByIdAndUpdate(eventId, {
    //     $set: {
    //       eventUrl: shortLink,
    //     },
    //   });
    //   successResponse.eventUrl = shortLink;
    // }

    return successResponse;
  }
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async isValidTimeRange(
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
  ): Promise<boolean> {
    // Convert HH:mm strings into minutes since midnight
    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;
    return startTotal < endTotal;
  }
  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
    user: DecodedUser,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    }
    const event = await this.eventModel.findById(id);
    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    let categoriesInObjectId = [];
    if (updateEventDto.categories) {
      for (let category of updateEventDto.categories) {
        if (!mongoose.isValidObjectId(category)) {
          return {
            success: false,
            message: 'Please provide a valid category id',
          };
        }
        const foundCategory = await this.categoryModel.findById(category);
        if (!foundCategory) {
          return {
            success: false,
            message: 'Category not found',
          };
        }
        categoriesInObjectId.push(new mongoose.Types.ObjectId(category));
      }

      updateEventDto.categories = categoriesInObjectId;
    }

    // let scheduleList = [];
    // if (updateEventDto.scheduleType) {
    //   if (
    //     updateEventDto.scheduleType == ScheduleTypes.FIXED &&
    //     updateEventDto.schedule &&
    //     updateEventDto.schedule.length
    //   ) {
    //     //Parse dates into date objects and also sort the dates and their respective durations in ascending order
    //     for (let i = 0; i < updateEventDto.schedule.length; i++) {
    //       if (updateEventDto.schedule[i].date) {
    //         updateEventDto.schedule[i].date = new Date(
    //           updateEventDto.schedule[i].date.toString(),
    //         );
    //         // for (
    //         //   let j = 0;
    //         //   j < updateEventDto.schedule[i].durations.length;
    //         //   j++
    //         // ) {
    //         //   updateEventDto.schedule[i].durations[j].startTime = new Date(
    //         //     updateEventDto.schedule[i].durations[j].startTime,
    //         //   );
    //         //   updateEventDto.schedule[i].durations[j].endTime = new Date(
    //         //     updateEventDto.schedule[i].durations[j].endTime,
    //         //   );
    //         // }
    //         updateEventDto.schedule[i].durations.sort((a, b) => {
    //           // return (
    //           //   new Date(a.startTime).getTime() -
    //           //   new Date(b.startTime).getTime()
    //           // );

    //           return (
    //             this.timeToMinutes(a.startTime) -
    //             this.timeToMinutes(b.startTime)
    //           );
    //         });

    //         updateEventDto.schedule.sort((a, b) => {
    //           return a.date - b.date;
    //         });
    //       }
    //     }

    //     for (let i = 0; i < updateEventDto.schedule.length; i++) {
    //       if (updateEventDto.schedule[i].date) {
    //         // const date = getStringDateTz(
    //         //   new Date(updateEventDto.schedule[i].date.toString()),
    //         // );
    //         const date = new Date(updateEventDto.schedule[i].date.toString());
    //         for (
    //           let j = 0;
    //           j < updateEventDto.schedule[i].durations.length;
    //           j++
    //         ) {
    //           const duration = updateEventDto.schedule[i].durations[j];
    //           if (duration) {
    //             if (
    //               new Date(duration.startTime.toString()) >
    //               new Date(duration.endTime.toString())
    //             ) {
    //               return {
    //                 success: false,
    //                 message: `Start date cannot be greater than end date for the schedule at index ${i} and duration at index ${j}`,
    //               };
    //             }
    //           }
    //         }
    //         let scheduleObj = {
    //           type: updateEventDto.scheduleType,
    //           event: new mongoose.Types.ObjectId(id),
    //           fixedSchedule: {
    //             date: new Date(date),
    //             durations: updateEventDto.schedule[i].durations,
    //           },
    //         };
    //         const createdSchedule =
    //           await this.scheduleModel.create(scheduleObj);
    //         scheduleList.push(createdSchedule._id);
    //       }
    //     }
    //   } else if (
    //     updateEventDto.scheduleType == ScheduleTypes.RECURRING &&
    //     updateEventDto.recurringSchedule
    //   ) {
    //     console.log('Check:1');
    //     let startDate = new Date(updateEventDto.recurringSchedule.startDate);
    //     let endDate = new Date(updateEventDto.recurringSchedule.endDate);
    //     updateEventDto.recurringSchedule.startDate = startDate;
    //     updateEventDto.recurringSchedule.endDate = endDate;
    //     console.log('Check:2', startDate, endDate);
    //     if (startDate > endDate) {
    //       return {
    //         success: false,
    //         message: `Start date cannot be greater than end date for this schedule`,
    //       };
    //     }
    //     let week = updateEventDto.recurringSchedule.weekDays;
    //     for (let i = 0; i < Object.keys(week).length; i++) {
    //       let day = Object.keys(updateEventDto.recurringSchedule.weekDays)[i];
    //       let dayObj = week[Object.keys(week)[i]];
    //       console.log('day:', day);
    //       console.log('Day Data:', dayObj);
    //       if (dayObj.included) {
    //         if (dayObj.durations.length == 0) {
    //           return {
    //             success: false,
    //             message: `Please provide the duration for the ${day}`,
    //           };
    //         }
    //         //durations array
    //         for (let j = 0; j < dayObj.durations.length; j++) {
    //           console.log('Duration:', dayObj.durations[j]);
    //           let duration = dayObj.durations[j];
    //           let startTime = duration.startTime;
    //           let endTime = duration.endTime;
    //           const isValid = this.isValidTimeRange(startHour, startMinute, endHour, endMinute);
    //           if (!isValid) {
    //             return {
    //               success: false,
    //               message: `Start time cannot be greater than end time for the day ${Object.keys(day)} and duration at index ${j}`,
    //             };
    //           }
    //         }
    //         dayObj.durations.sort((a, b) => {
    //           return (
    //             this.timeToMinutes(a.startTime) -
    //             this.timeToMinutes(b.startTime)
    //           );
    //         });
    //         updateEventDto.recurringSchedule.weekDays[day] = dayObj;
    //       }
    //     }

    //     let scheduleObj = {
    //       type: updateEventDto.scheduleType,
    //       event: new mongoose.Types.ObjectId(id),
    //       recurringSchedule: {
    //         startDate: updateEventDto.recurringSchedule.startDate,
    //         endDate: updateEventDto.recurringSchedule.endDate,
    //         weekDays: updateEventDto.recurringSchedule.weekDays,
    //       },
    //     };
    //     const createdSchedule = await this.scheduleModel.create(scheduleObj);
    //     scheduleList.push(createdSchedule._id);

    //     // if (updateEventDto.recurringSchedule.dayOfWeek.length > 0) {
    //     //   for (
    //     //     let j = 0;
    //     //     j < updateEventDto.recurringSchedule.durations.length;
    //     //     j++
    //     //   ) {
    //     //     updateEventDto.recurringSchedule.durations[j].startTime = new Date(
    //     //       updateEventDto.recurringSchedule.durations[j].startTime,
    //     //     );
    //     //     updateEventDto.recurringSchedule.durations[j].endTime = new Date(
    //     //       updateEventDto.recurringSchedule.durations[j].endTime,
    //     //     );
    //     //   }
    //     //   updateEventDto.recurringSchedule.durations.sort((a, b) => {
    //     //     return (
    //     //       new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    //     //     );
    //     //   });
    //     //   for (
    //     //     let j = 0;
    //     //     j < updateEventDto.recurringSchedule.durations.length;
    //     //     j++
    //     //   ) {
    //     //     let duration = updateEventDto.recurringSchedule.durations[j];
    //     //     if (duration) {
    //     //       if (
    //     //         new Date(duration.startTime.toString()) >
    //     //         new Date(duration.endTime.toString())
    //     //       ) {
    //     //         return {
    //     //           success: false,
    //     //           message: `Start date cannot be greater than end date for this schedule  and duration at index ${j}`,
    //     //         };
    //     //       }
    //     //     }
    //     //   }

    //     // }
    //   }
    // }
    // console.log('Check:3', scheduleList);
    if (
      event.creatorType === BusinessUser.name &&
      (event.businessProfile.toString() !== user.businessProfile ||
        event.user.toString() !== user.id)
    ) {
      return {
        success: false,
        message: 'You are not authorized to update this event',
      };
    } else {
      if (
        event.creatorType === User.name &&
        event.user.toString() !== user.id
      ) {
        return {
          success: false,
          message: 'You are not authorized to update this event',
        };
      }
    }

    if (event.type == EventTypes.PRIVATE) {
      // if (!updateEventDto.RSVP) {
      //   return {
      //     success: false,
      //     message: 'RSVP value is required for creating a private event.',
      //   };
      // } else {
      //   if (!Object.values(RSVPTypes).includes(updateEventDto.RSVP)) {
      //     return {
      //       success: false,
      //       message: 'Invalid RSVP value',
      //     };
      //   }
      // }
      updateEventDto.isFree = false;
    }
    if (updateEventDto.locations) {
      if (updateEventDto.locations.length) {
        // const userDoc = await this.userModel.findById(user.id);
        // const activeSubscriptions = await this.subscriptionModel.find({
        //   user: new mongoose.Types.ObjectId(user.id),
        //   endDate: { $gte: new Date() },
        // });
        // if (activeSubscriptions.length < updateEventDto.locations.length) {
        //   return {
        //     success: false,
        //     message: `You have only ${activeSubscriptions.length} active subscriptions, please subscribe to add more locations`,
        //   };
        // }

        for (let i = 0; i < updateEventDto.locations.length; i++) {
          if (typeof updateEventDto.locations[i] == 'string') {
            if (!mongoose.isValidObjectId(updateEventDto.locations[i])) {
              return {
                success: false,
                message: `Please provide a valid location id, ${updateEventDto.locations[i]} is not valid`,
              };
            }
          }
        }
      }
    }

    if (updateEventDto.ageGroupsAllowed) {
      if (updateEventDto.ageGroupsAllowed.length) {
        await this.eventModel.findByIdAndUpdate(id, {
          $set: { ageGroupsAllowed: [] },
        });
        for (let i = 0; i < updateEventDto.ageGroupsAllowed.length; i++) {
          if (!mongoose.isValidObjectId(updateEventDto.ageGroupsAllowed[i])) {
            return {
              success: false,
              message: `Please provide a valid age group id, ${updateEventDto.ageGroupsAllowed[i]} is not valid`,
            };
          }
          const ageGroup = await this.ageGroupModel.findById(
            updateEventDto.ageGroupsAllowed[i],
          );
          if (!ageGroup) {
            return {
              success: false,
              message: `Age group with id ${updateEventDto.ageGroupsAllowed[i]} not found`,
            };
          }
          updateEventDto.ageGroupsAllowed[i] = ageGroup._id;
        }
      }
    }

    if (updateEventDto.locations) {
      if (updateEventDto.locations.length) {
        await this.eventLocationModel.deleteMany({
          event: new mongoose.Types.ObjectId(id),
        });
        await this.eventModel.updateOne(
          {
            _id: new mongoose.Types.ObjectId(id),
          },
          {
            $set: { locations: [] },
          },
        );
        for (let i = 0; i < updateEventDto.locations.length; i++) {
          const location = updateEventDto.locations[i];
          if (
            event.creatorType === BusinessUser.name &&
            !mongoose.isValidObjectId(location)
          ) {
            return {
              success: false,
              message: `Please provide a valid location id`,
            };
          }
          if (mongoose.isValidObjectId(location)) {
            if (event.creatorType === User.name) {
              return {
                success: false,
                message: `Please provide valid location object for the event`,
              };
            }
            const outletDoc = await this.outletModel.findById(location);
            if (!outletDoc) {
              return {
                success: false,
                message: `Outlet with id ${location} not found`,
              };
            } else {
              const createdlocation = await this.eventLocationModel.create({
                event: new mongoose.Types.ObjectId(id),
                businessLocationId: outletDoc._id,
                location: {
                  type: 'Point',
                  coordinates: [outletDoc.longitude, outletDoc.latitude],
                },
                accuracy: outletDoc.accuracy,
                address1: outletDoc.address1,
                address2: outletDoc.address2 ? outletDoc.address2 : '',
                city: outletDoc.city,
                state: outletDoc.state,
                zip: outletDoc.zip,
                website: outletDoc.website,
                email: outletDoc.email,
                phone: outletDoc.phone,
              });
              // console.log('created-location---->', createdlocation);
              await this.eventModel.updateOne(
                {
                  _id: new mongoose.Types.ObjectId(id),
                },
                {
                  $addToSet: { locations: createdlocation._id },
                },
              );
            }
          } else {
            const locationData: Location = location as Location;
            const latitude = locationData.latitude;
            const longitude = locationData.longitude;
            delete locationData.latitude;
            delete locationData.longitude;
            const locationAddQuery = {
              event: new mongoose.Types.ObjectId(id),
              location: {
                type: 'Point',
                coordinates: [longitude, latitude],
              },
              ...locationData,
            };
            const createdlocation =
              await this.eventLocationModel.create(locationAddQuery);
            await this.eventModel.updateOne(
              {
                _id: new mongoose.Types.ObjectId(id),
              },
              {
                $addToSet: { locations: createdlocation._id },
              },
            );
            // console.log(`created-location:-------${createdlocation}`);
          }
        }
        delete updateEventDto.locations;
      }
    }
    if (updateEventDto.promotionCode) {
      // if (!updateEventDto.code) {
      // updateEventDto.promotionCode = await this.generateUniqueEventCode();
      // } else {
      updateEventDto.promotionCode = updateEventDto.code;
      // }
    } else {
      delete updateEventDto.promotionCode;
    }
    // if (updateEventDto.schedule && updateEventDto.schedule.length) {
    //   for (let i = 0; i < updateEventDto.schedule.length; i++) {
    //     if (updateEventDto.schedule[i].date) {
    //       updateEventDto.schedule[i].date = new Date(
    //         updateEventDto.schedule[i].date as string,
    //       );
    //       for (
    //         let j = 0;
    //         j < updateEventDto.schedule[i].durations.length;
    //         j++
    //       ) {
    //         updateEventDto.schedule[i].durations[j].startTime = new Date(
    //           updateEventDto.schedule[i].durations[j].startTime as string,
    //         );
    //         updateEventDto.schedule[i].durations[j].endTime = new Date(
    //           updateEventDto.schedule[i].durations[j].endTime as string,
    //         );
    //       }
    //     }
    //   }
    // }

    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...updateEventDto,
            // eventSchedule: scheduleList,
          },
        },
        { new: true },
      )
      .populate('images', ImagePopulates.FOREIGN)
      .populate('locations', LocationPopulates.FOREIGN)
      .populate('ageGroupsAllowed', 'name')
      .populate({
        path: 'categories',
        select: '_id name image color',
      });

    const eventLatestDetails = await this.eventModel
      .findById(id)
      .populate('images', ImagePopulates.FOREIGN)
      .populate('locations', LocationPopulates.FOREIGN)
      .populate('ageGroupsAllowed', 'name')
      .populate({
        path: 'categories',
        select: '_id name image color',
      })
      .populate('user', UserPopulates.FOREIGN)
      .populate('businessProfile', BusinessPopulates.FOREIGN);
    const eventObj = JSON.parse(JSON.stringify(eventLatestDetails));
    if (updatedEvent.creatorType === 'User') {
      const creator = await this.userModel.findById(updatedEvent.user);
      const isFollowedByMe = await this.followModel.findOne({
        followerType: User.name,
        follower: new mongoose.Types.ObjectId(user.id),
        followingType: User.name,
        following: creator._id,
        isBlocked: false,
      });
      eventObj['creatorDetails'] = {
        _id: creator._id,
        name: creator.name,
        profilePhoto: creator.profilePhoto,
        email: creator.email,
        phone: creator.phone,
        website: '',
        bio: '',
        followersCount: creator.followersCount,
        profileType: 'User',
        following: isFollowedByMe ? true : false,
        isMe: creator.id == user.id,
      };
    } else {
      const business = await this.businessModel.findById(
        updatedEvent.businessProfile,
      );
      const isFollowedByMe = await this.followModel.findOne({
        followerType: User.name,
        follower: new mongoose.Types.ObjectId(user.id),
        followingType: Business.name,
        following: business._id,
        isBlocked: false,
      });
      eventObj['creatorDetails'] = {
        _id: business._id,
        name: business.name,
        profilePhoto: business.logo,
        email: business.email,
        bio: business.bio,
        phone: business.phone,
        website: business.website,
        followersCount: business.followersCount,
        profileType: 'BusinessProfile',
        following: isFollowedByMe ? true : false,
        isMe: business.id == user.id,
      };
    }
    // if (eventLatestDetails.status == EventStatus.PUBLISHED) {
    // if (updateEventDto.isFinalStep) {
    //   if (event.status == EventStatus.PUBLISHED) {
    //     if (updatedEvent.creatorType === BusinessProfile.name) {
    //       if (eventObj.notifyFollowers) {
    //         const business = await this.businessProfileModel.findById(
    //           user.businessProfile,
    //         );
    //         const followersRes = await this.userService.getFollowers(
    //           user.businessProfile,
    //         );
    //         if (followersRes.count && followersRes.followers.length) {
    //           const followers = followersRes.followers;
    //           for (let i = 0; i < followers.length; i++) {
    //             const fcmTokens = await this.tokenModel.find({
    //               userId: followers[i].follower['_id'],
    //               type: TokenTypes.FCM,
    //             });
    //             const actionType =
    //               // eventLatestDetails.status == EventStatus.PUBLISHED?
    //               // 'published':
    //               'updated';
    //             let eventType = '';
    //             switch (event.type) {
    //               case EventTypes.PRIVATE:
    //                 eventType = 'Private';
    //                 break;
    //               case EventTypes.FORMAL || EventTypes.INFORMAL:
    //                 eventType = 'Event';
    //                 break;
    //               case EventTypes.OFFER:
    //                 eventType = 'Offer';
    //                 break;
    //               default:
    //                 eventType = 'Event';
    //             }
    //             const message = `${business.name} ${actionType} the ${eventType} called ${updatedEvent.title}`;
    //             for (let j = 0; j < fcmTokens.length; j++) {
    //               this.firebaseService.sendNotification(
    //                 fcmTokens[j].token,
    //                 event.title,
    //                 message,
    //                 { data: NotificationTypes.EVENT, id: updatedEvent.id },
    //               );
    //             }
    //             await this.notificationModel.create({
    //               type: 'event',
    //               event: new mongoose.Types.ObjectId(id),
    //               targetType: BusinessProfile.name,
    //               targetUser: new mongoose.Types.ObjectId(user.businessProfile),
    //               message,
    //               user: followers[i].follower['_id'],
    //             });
    //           }
    //         }
    //       }
    //     }
    //   }
    //   // }
    // }
    return {
      success: true,
      message: 'Event updated successfully',
      event: eventObj,
    };
  }

  async deleteImage(id: string, user: DecodedUser) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid image id',
      };
    } else {
      const image = await this.imageModel.findById(id);
      if (!image) {
        return {
          success: false,
          message: 'Image not found',
        };
      }
      const event = await this.eventModel.findById(image.event.toString());
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      } else if (
        event.creatorType === BusinessProfile.name &&
        event.businessProfile.toString() !== user.businessProfile
      ) {
        return {
          success: false,
          message: 'You are not authorized to delete this image',
        };
      } else if (
        event.creatorType === User.name &&
        event.user.toString() !== user.id
      ) {
        return {
          success: false,
          message: 'You are not authorized to delete this image',
        };
      } else {
        await this.imageModel.findByIdAndDelete(id);
        await this.eventModel.findByIdAndUpdate(event._id, {
          $pull: { images: new mongoose.Types.ObjectId(id) },
        });
        return {
          success: true,
          message: 'Image deleted successfully',
        };
      }
    }
  }

  async addImages(
    id: string,
    user: DecodedUser,
    images: Express.Multer.File[],
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const event = await this.eventModel.findById(id);
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      }
      if (
        event.creatorType === BusinessProfile.name &&
        event.businessProfile.toString() !== user.businessProfile
      ) {
        return {
          success: false,
          message: 'You are not authorized to add images to this event',
        };
      } else if (
        event.creatorType === User.name &&
        event.user.toString() !== user.id
      ) {
        return {
          success: false,
          message: 'You are not authorized to add images to this event',
        };
      } else {
        // if (event.images.length + images.length > 5) {
        //   return {
        //     success: false,
        //     message: `Event is having ${event.images.length} images, you can add only ${5 - event.images.length} images to this event`,
        //   };
        // }
        const eventImages = [];
        for (let i = 0; i < images.length; i++) {
          const result = await this.s3Service.s3_upload(
            images[i].buffer,
            process.env.AWS_S3_BUCKET_NAME,
            manipulateImageName(images[i].originalname),
            'image/jpeg',
          );
          const image = await this.imageModel.create({
            url: result.Location,
            event: event._id,
          });
          eventImages.push(image._id);
        }
        const eventResult = await this.eventModel
          .findByIdAndUpdate(
            event._id,
            {
              $push: { images: { $each: eventImages } },
            },
            { new: true },
          )
          .populate('images', ImagePopulates.FOREIGN)
          .populate('category', CategoryPopulates.FOREIGN);
        return {
          success: true,
          message: 'Images added to event successfully',
          event: eventResult,
        };
      }
    }
  }

  async getCreatedEvents(user: DecodedUser, page: number, limit: number) {
    let query = {};
    if (user.isBusiness) {
      query = {
        creatorType: BusinessProfile.name,
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
      };
    } else {
      query = {
        creatorType: User.name,
        user: new mongoose.Types.ObjectId(user.id),
        type: EventTypes.PRIVATE,
      };
    }
    const events = await this.eventModel
      .find(query)
      .populate('images', ImagePopulates.FOREIGN)
      .populate('locations', LocationPopulates.FOREIGN)
      .populate('ageGroupsAllowed', 'name')
      .populate({
        path: 'categories',
        select: CategoryPopulates.FOREIGN,
      })
      .populate({
        path: 'user',
        select: UserPopulates.FOREIGN,
      })
      .populate({
        path: 'businessProfile',
        select: BusinessPopulates.FOREIGN,
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    let resData = [];
    //loop events and add creatorDetails
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventObj = JSON.parse(JSON.stringify(event));
      if (event.creatorType === 'User') {
        const creator = await this.userModel.findById(event.user);
        const isFollowedByMe = await this.followModel.findOne({
          followerType: User.name,
          follower: new mongoose.Types.ObjectId(user.id),
          followingType: User.name,
          following: creator._id,
          isBlocked: false,
        });
        eventObj['creatorDetails'] = {
          _id: creator._id,
          name: creator.name,
          profilePhoto: creator.profilePhoto,
          email: creator.email,
          phone: creator.phone,
          website: '',
          bio: '',
          followersCount: creator.followersCount,
          profileType: 'User',
          following: isFollowedByMe ? true : false,
          isMe: creator.id == user.id,
        };
      } else {
        const businessProfile = await this.businessProfileModel.findById(
          event.businessProfile,
        );
        const isFollowedByMe = await this.followModel.findOne({
          followerType: User.name,
          follower: new mongoose.Types.ObjectId(user.id),
          followingType: BusinessProfile.name,
          following: businessProfile._id,
          isBlocked: false,
        });
        eventObj['creatorDetails'] = {
          _id: businessProfile._id,
          name: businessProfile.name,
          profilePhoto: businessProfile.logo,
          email: businessProfile.email,
          bio: businessProfile.bio,
          phone: businessProfile.phone,
          website: businessProfile.website,
          followersCount: businessProfile.followersCount,
          profileType: 'BusinessProfile',
          following: isFollowedByMe ? true : false,
          isMe: businessProfile.id == user.id,
        };
      }
      resData.push(eventObj);
    }
    //Return Active and Draft events first, sorted by the next valid date time for the content, soonest to latest.
    //Then return Expired events, sorted by the last date of the event first most recent to oldest.
    //Sorting this way will ensure all expired events are at the bottom. Items with no dates should be considered as the Soonest i.e. at the top of the list.

    //sort the events with upper mentioned logic
    //1. Return Active and Draft events first, sorted by the next valid date time for the content, soonest to latest.
    //2. Then return Expired events, sorted by the last date of the event first most recent to oldest.
    //3. Sorting this way will ensure all expired events are at the bottom. Items with no dates should be considered as the Soonest i.e. at the top of the list.
    resData = resData.sort((a, b) => {
      if (a.schedule.length && b.schedule.length) {
        const aDate = new Date(a.schedule[0].date);
        const bDate = new Date(b.schedule[0].date);
        return (bDate as any) - (aDate as any);
      }
      // else if (a.schedule.length && !b.schedule.length) {
      //   return -1;
      // } else if (!a.schedule.length && b.schedule.length) {
      //   return 1;
      // }
      else {
        if (
          !a.schedule.length &&
          b.schedule.length &&
          a.status == EventStatus.DRAFTED
        ) {
          //a should come first and else b should come first
          return -1;
        } else if (
          a.schedule.length &&
          !b.schedule.length &&
          b.status == EventStatus.DRAFTED
        ) {
          // b should come first
          return 1;
        } else {
          return 0;
        }
      }
    });
    const totalDocs = await this.eventModel.countDocuments(query);
    return {
      success: true,
      message: 'Events fetched successfully',
      events: resData,
      total: totalDocs,
      page,
      limit,
      pages: Math.ceil(totalDocs / limit),
    };
  }

  async getCreatedEventsV2(
    user: DecodedUser,
    isExpired: boolean,
    page: number,
    limit: number,
  ) {
    let query = {};
    if (user.isBusiness) {
      query = {
        creatorType: BusinessUser.name,
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
      };
    } else {
      query = {
        creatorType: User.name,
        user: new mongoose.Types.ObjectId(user.id),
        type: EventTypes.PRIVATE,
      };
    }
    // if (isExpired) {
    //   query['$expr'] = {
    //     $not: {
    //       $elemMatch: {
    //         'schedule.date': { $gte: currentDateTz() },
    //       },
    //     },
    //   };
    // } else {
    //   query['schedule'] = {
    //     $elemMatch: {
    //       date: { $gte: currentDateTz() },
    //     },
    //   };
    // }
    if (isExpired) {
      query['$expr'] = {
        $not: {
          $anyElementTrue: {
            $map: {
              input: '$schedule',
              as: 'item',
              in: { $gte: ['$$item.date', currentDateTz()] },
            },
          },
        },
      };
    } else {
      query['$expr'] = {
        $anyElementTrue: {
          $map: {
            input: '$schedule',
            as: 'item',
            in: { $gte: ['$$item.date', currentDateTz()] },
          },
        },
      };
    }
    console.log('query when in content management', query);
    const events = await this.eventModel
      .find(query)
      .populate('images', ImagePopulates.FOREIGN)
      .populate('locations', LocationPopulates.FOREIGN)
      .populate('ageGroupsAllowed', 'name')
      .populate({ path: 'categories', select: CategoryPopulates.FOREIGN })
      .populate({
        path: 'user',
        select: UserPopulates.FOREIGN,
      })
      .populate({
        path: 'businessProfile',
        select: BusinessPopulates.FOREIGN,
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    let resData = [];
    //loop events and add creatorDetails
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventObj = JSON.parse(JSON.stringify(event));
      if (event.creatorType === 'User') {
        const creator = await this.userModel.findById(event.user);
        const isFollowedByMe = await this.followModel.findOne({
          followerType: User.name,
          follower: new mongoose.Types.ObjectId(user.id),
          followingType: User.name,
          following: creator._id,
          isBlocked: false,
        });
        eventObj['creatorDetails'] = {
          _id: creator._id,
          name: creator.name,
          profilePhoto: creator.profilePhoto,
          email: creator.email,
          phone: creator.phone,
          website: '',
          bio: '',
          followersCount: creator.followersCount,
          profileType: 'User',
          following: isFollowedByMe ? true : false,
          isMe: creator.id == user.id,
        };
      } else {
        const businessProfile = await this.businessProfileModel.findById(
          event.businessProfile,
        );
        const isFollowedByMe = await this.followModel.findOne({
          followerType: User.name,
          follower: new mongoose.Types.ObjectId(user.id),
          followingType: BusinessProfile.name,
          following: businessProfile._id,
          isBlocked: false,
        });
        eventObj['creatorDetails'] = {
          _id: businessProfile._id,
          name: businessProfile.name,
          profilePhoto: businessProfile.logo,
          email: businessProfile.email,
          bio: businessProfile.bio,
          phone: businessProfile.phone,
          website: businessProfile.website,
          followersCount: businessProfile.followersCount,
          profileType: 'BusinessProfile',
          following: isFollowedByMe ? true : false,
          isMe: businessProfile.id == user.id,
        };
      }
      resData.push(eventObj);
    }

    //If isExpired key is true, sor the data in descending order of the date, else sort in ascending order of the date
    resData = resData.sort((a, b) => {
      if (isExpired) {
        const aDate = new Date(a.schedule[0].date);
        const bDate = new Date(b.schedule[0].date);
        return (bDate as any) - (aDate as any);
      } else {
        const aDate = new Date(a.schedule[0].date);
        const bDate = new Date(b.schedule[0].date);
        return (aDate as any) - (bDate as any);
      }
    });
    const totalDocs = await this.eventModel.countDocuments(query);
    return {
      success: true,
      message: 'Events fetched successfully',
      events: resData,
      total: totalDocs,
      page,
      limit,
      pages: Math.ceil(totalDocs / limit),
    };
  }

  async getCreatedEvent(id: string, user: DecodedUser) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const event = await this.eventModel
        .findById(id)
        .populate('images', ImagePopulates.FOREIGN)
        .populate('locations', LocationPopulates.FOREIGN)
        .populate('ageGroupsAllowed', 'name')
        .populate({ path: 'categories', select: CategoryPopulates.FOREIGN })
        .populate('user', UserPopulates.FOREIGN)
        .populate('businessProfile', BusinessPopulates.FOREIGN);
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      }
      if (event.creatorType === BusinessProfile.name) {
        if (event.businessProfile._id.toString() !== user.businessProfile) {
          return {
            success: false,
            message: 'You are not authorized to access this event',
          };
        }
      } else {
        if (event.user._id.toString() !== user.id) {
          return {
            success: false,
            message: 'You are not authorized to access this event',
          };
        }
      }
      const eventObj = JSON.parse(JSON.stringify(event));
      if (event.creatorType === 'User') {
        const creator = await this.userModel.findById(event.user);
        const isFollowedByMe = await this.followModel.findOne({
          followerType: User.name,
          follower: new mongoose.Types.ObjectId(user.id),
          followingType: User.name,
          following: creator._id,
          isBlocked: false,
        });
        eventObj['creatorDetails'] = {
          _id: creator._id,
          name: creator.name,
          profilePhoto: creator.profilePhoto,
          email: creator.email,
          phone: creator.phone,
          website: '',
          bio: '',
          followersCount: creator.followersCount,
          profileType: 'User',
          following: isFollowedByMe ? true : false,
          isMe: creator.id == user.id,
        };
      } else {
        const businessProfile = await this.businessProfileModel.findById(
          event.businessProfile,
        );
        const isFollowedByMe = await this.followModel.findOne({
          followerType: User.name,
          follower: new mongoose.Types.ObjectId(user.id),
          followingType: BusinessProfile.name,
          following: businessProfile._id,
          isBlocked: false,
        });
        eventObj['creatorDetails'] = {
          _id: businessProfile._id,
          name: businessProfile.name,
          profilePhoto: businessProfile.logo,
          email: businessProfile.email,
          bio: businessProfile.bio,
          phone: businessProfile.phone,
          website: businessProfile.website,
          followersCount: businessProfile.followersCount,
          profileType: 'BusinessProfile',
          following: isFollowedByMe ? true : false,
          isMe: businessProfile.id == user.id,
        };
      }

      return {
        success: true,
        message: 'Event fetched successfully',
        event: eventObj,
      };
    }
  }

  async getCrawledEvents(page: number, limit: number, status: string) {
    let searchQuery = {};
    if (status && status != 'all') {
      searchQuery = { status };
    } else {
      searchQuery = {
        status: CrawledEventStatus.CRAWLED,
      };
    }
    const crawledEvents = await this.crawledEventModel
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    const totalCrawledEvents = await this.crawledEventModel.find(searchQuery);
    const pages = Math.ceil(totalCrawledEvents.length / limit);
    return {
      success: true,
      message: 'Crawled events fetched successfully',
      count: crawledEvents.length,
      crawledEvents,
      page,
      pages,
    };
  }

  async deleteCrawledEvent(id: string) {
    const crawledEvent = await this.crawledEventModel.findById(id);
    if (!crawledEvent) {
      return {
        success: false,
        message: 'Crawled event not found',
      };
    }
    await this.crawledEventModel.findByIdAndDelete(id);
    return {
      success: true,
      message: 'Crawled event deleted successfully',
    };
  }

  async updateCrawledEvent(id: string, data: UpdateCrawledEventDto) {
    const updatedEvent = await this.crawledEventModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { ...data } },
      { new: true },
    );
    if (!updatedEvent) {
      return {
        success: false,
        message: 'No event data found with the id',
      };
    } else {
      return {
        success: true,
        message: 'Event updated successfully.',
        event: updatedEvent,
      };
    }
  }

  async publishCrawledEvent(data: PublishCrawledEventDto) {
    const { ids, user, businessProfile } = data;
    let resData = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const foundDoc = await this.crawledEventModel.findById(id);
      if (!foundDoc) {
        return {
          success: false,
          message: 'No event data found with the id',
        };
      } else {
        let images = [];
        //Download image and upload to s3 bucket
        if (foundDoc.image) {
          const file = await this.downloadImage(foundDoc.image);
          const result = await this.s3Service.s3_upload(
            file,
            process.env.AWS_S3_BUCKET_NAME,
            manipulateImageName(foundDoc.title),
            'image/jpeg',
          );
          const createdImage = await this.imageModel.create({
            url: result.Location,
          });
          images.push(createdImage._id);
        }
        //Save event location
        let findQuery = {};
        if (mongoose.isValidObjectId(foundDoc.category)) {
          findQuery = { _id: new mongoose.Types.ObjectId(foundDoc.category) };
        } else {
          findQuery = { name: foundDoc.category };
        }
        const category = await this.categoryModel.findOne(findQuery);
        if (!category) {
          return {
            success: false,
            message: 'Category not found',
          };
        }
        const allAgeGroup = await this.ageGroupModel.findOne({
          name: 'all',
        });
        const event = await this.eventModel.create({
          isFromCrawler: true,
          businessProfile: new mongoose.Types.ObjectId(businessProfile),
          user: new mongoose.Types.ObjectId(user),
          type: foundDoc.type,
          creatorType: BusinessProfile.name,
          status: EventStatus.PUBLISHED,
          category,
          images,
          title: foundDoc.title,
          description: foundDoc.description,
          schedule: foundDoc.schedule,
          // locations: [createdLocation._id],
          ageGroupsAllowed: [allAgeGroup._id],
          targetGenders: ['male', 'female', 'other'],
          promotionCode: '',
          // isFree: foundDoc.participationCost == 'Free' ? true : false,
          isFree: true,
          // participationCost: foundDoc.participationCost.split('')[1],
          participationCost: foundDoc.participationCost
            ? foundDoc.participationCost
            : '',
          bookingUrl: foundDoc.website ? foundDoc.website : '',
          offset: foundDoc.offset,
        });
        if (foundDoc.coordinates) {
          const locationObj = {
            type: 'Point',
            coordinates: [
              foundDoc.coordinates['lng'],
              foundDoc.coordinates['lat'],
            ],
          };
          // Add the location to business location as well
          const businessLocationId = await this.businessLocationModel.create({
            latitude: foundDoc.coordinates['lat'],
            longitude: foundDoc.coordinates['lng'],
            accuracy: 0,
            address1: foundDoc.address,
            address2: '',
            city: '',
            state: '',
            zip: '',
            website: foundDoc.website ? foundDoc.website : '',
            email: foundDoc.email ? foundDoc.email : '',
            phone: foundDoc.phone ? foundDoc.phone : '',
            businessProfile: new mongoose.Types.ObjectId(businessProfile),
          });
          const createdLocation = await this.eventLocationModel.create({
            location: locationObj,
            accuracy: 0,
            event: event._id,
            address1: foundDoc.address,
            address2: '',
            city: '',
            state: '',
            zip: '',
            website: foundDoc.website ? foundDoc.website : '',
            email: foundDoc.email ? foundDoc.email : '',
            phone: foundDoc.phone ? foundDoc.phone : '',
            businessLocationId: businessLocationId._id,
          });
          const updatedEvent = await this.eventModel.findByIdAndUpdate(
            event.id,
            {
              $addToSet: {
                locations: createdLocation._id,
              },
            },
            { new: true },
          );
          resData.push(updatedEvent);

          //Update the crawled event status
          await this.crawledEventModel.findByIdAndUpdate(id, {
            status: CrawledEventStatus.PUBLISHED,
          });
        } else {
          resData.push(event);
        }
      }
    }
    return {
      success: true,
      message: 'Event has been published successfully.',
      data: resData,
    };
  }

  async downloadImage(url: string) {
    return new Promise((resolve, reject) => {
      this.httpService
        .get(url, {
          responseType: 'stream',
        })
        .subscribe((response) => {
          const file = response.data;
          resolve(file);
        });
    });
  }

  async updateEventImage(
    id: string,
    user: DecodedUser,
    file: Express.Multer.File,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const image = await this.imageModel.findById(id);
      if (!image) {
        return {
          success: false,
          message: 'Event image not found',
        };
      }
      const event = await this.eventModel.findById(image.event);
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      } else if (
        event.creatorType === BusinessProfile.name &&
        event.businessProfile.toString() !== user.businessProfile
      ) {
        return {
          success: false,
          message: 'You are not authorized to update this event',
        };
      } else if (
        event.creatorType === User.name &&
        event.user.toString() !== user.id
      ) {
        return {
          success: false,
          message: 'You are not authorized to update this event',
        };
      } else {
        const result = await this.s3Service.s3_upload(
          file.buffer,
          process.env.AWS_S3_BUCKET_NAME,
          manipulateImageName(file.originalname),
          'image/jpeg',
        );
        const image = await this.imageModel.findByIdAndUpdate(
          id,
          {
            url: result.Location,
          },
          { new: true },
        );
        return {
          success: true,
          message: 'Event image updated successfully',
          image,
        };
      }
    }
  }

  async togglePublishEvent(data: PublishEventDto, user: DecodedUser) {
    const id = data.id;
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const event = await this.eventModel.findById(id);
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      } else if (
        event.creatorType === BusinessProfile.name &&
        event.businessProfile.toString() !== user.businessProfile
      ) {
        return {
          success: false,
          message: 'You are not authorized to update this event',
        };
      } else if (
        event.creatorType === User.name &&
        event.user.toString() !== user.id
      ) {
        return {
          success: false,
          message: 'You are not authorized to update this event',
        };
      } else {
        if (event.status == EventStatus.CLOSED) {
          return {
            success: false,
            message: 'Cannot update the status as the event is closed',
          };
        } else if (event.status == EventStatus.BLOCKED) {
          return {
            success: false,
            message:
              'Cannot update the status as the admin has blocked the event.',
          };
        } else if (event.status == EventStatus.PUBLISHED) {
          await this.eventModel.findByIdAndUpdate(id, {
            status: EventStatus.DRAFTED,
          });
          return {
            success: true,
            message: 'Event status updated successfully',
            status: EventStatus.DRAFTED,
          };
        } else if (event.status == EventStatus.DRAFTED) {
          await this.eventModel.findByIdAndUpdate(id, {
            status: EventStatus.PUBLISHED,
          });
          if (event.notifyFollowers) {
            const business = await this.businessProfileModel.findById(
              user.businessProfile,
            );
            const followersRes = await this.userService.getFollowers(
              user.businessProfile,
            );
            let eventType = '';
            switch (event.type) {
              case EventTypes.PRIVATE:
                eventType = 'Private';
                break;
              case EventTypes.FORMAL || EventTypes.INFORMAL:
                eventType = 'Event';
                break;
              case EventTypes.OFFER:
                eventType = 'Offer';
                break;
              default:
                eventType = 'Event';
            }
            if (followersRes.count && followersRes.followers.length) {
              const followers = followersRes.followers;
              const message = `${business.name} published a new ${eventType} called ${event.title}`;
              for (let i = 0; i < followers.length; i++) {
                const fcmTokens = await this.tokenModel.find({
                  userId: followers[i].follower['_id'],
                  type: TokenTypes.FCM,
                });
                for (let j = 0; j < fcmTokens.length; j++) {
                  this.firebaseService.sendNotification(
                    fcmTokens[j].token,
                    event.title,
                    message,
                    { data: NotificationTypes.EVENT, id: event.id },
                  );
                }
                await this.notificationModel.create({
                  type: NotificationTypes.EVENT,
                  event: new mongoose.Types.ObjectId(id),
                  targetType: BusinessProfile.name,
                  targetUser: new mongoose.Types.ObjectId(user.businessProfile),
                  message,
                  user: followers[i].follower['_id'],
                });
              }
            }
          }
          if (data.saveAsTemplate) {
            let createQuery = { ...event.toObject() };
            if (event.creatorType === BusinessProfile.name) {
              createQuery['businessProfile'] = new mongoose.Types.ObjectId(
                user.businessProfile,
              );
            } else {
              createQuery['user'] = new mongoose.Types.ObjectId(user.id);
            }
            const createdTemplate = await this.templateModel.create({
              ...createQuery,
              user: user.id,
              creatorType: user.isBusiness ? BusinessProfile.name : User.name,
            });
          }
          return {
            success: true,
            message: 'Event status updated successfully',
            status: EventStatus.PUBLISHED,
          };
        }
      }
    }
  }

  async getEventInvitation(data: InviteEventDto, user: DecodedUser) {
    const event = await this.eventModel.findById(data.event);
    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }
    if (event.creatorType === BusinessProfile.name) {
      if (event.businessProfile.toString() !== user.businessProfile) {
        return {
          success: false,
          message: 'You are not authorized to access this event',
        };
      }
    } else {
      if (event.user.toString() !== user.id) {
        return {
          success: false,
          message: 'You are not authorized to access this event',
        };
      }
    }
    if (!data.users) {
      data.users = [];
    }
    if (data.users.length) {
      for (let i = 0; i < data.users.length; i++) {
        if (!mongoose.isValidObjectId(data.users[i])) {
          return {
            success: false,
            message: `Please provide a valid user id, ${data.users[i]} is not valid`,
          };
        } else {
          const userDoc = await this.userModel.findById(data.users[i]);
          if (!userDoc) {
            return {
              success: false,
              message: `User with id ${data.users[i]} not found`,
            };
          }
        }
      }
    }
    const invitation = await this.eventInvitationModel.findOne({
      event: new mongoose.Types.ObjectId(data.event),
    });
    const invitees = data.users.map((user) => {
      return new mongoose.Types.ObjectId(user);
    });
    if (!invitation) {
      const createdInvitation = await this.eventInvitationModel.create({
        event: new mongoose.Types.ObjectId(data.event),
        usersAdded: invitees,
      });
      // Push invitees to event participants
      if (invitees.length) {
        await this.eventModel.findByIdAndUpdate(data.event, {
          $push: { participants: { $each: invitees } },
        });
      }
      return {
        success: true,
        message: 'Event invitations fetched successfully',
        invitation: createdInvitation,
      };
    } else {
      if (invitees.length) {
        await this.eventInvitationModel.findByIdAndUpdate(invitation._id, {
          $addToSet: { usersAdded: { $each: invitees } },
        });
        await this.eventModel.findByIdAndDelete(data.event, {
          $addToSet: { participants: { $each: invitees } },
        });
      }
      return {
        success: true,
        message: 'Event invitations fetched successfully',
        invitation,
      };
    }
  }

  async acceptInvitation(data: AcceptInvitationDto, user: DecodedUser) {
    const invitationId = data.id;
    const invitation = await this.eventInvitationModel.findById(invitationId);
    const foundEvent = await this.eventModel.findById(invitation.event);
    if (foundEvent.user.toString() === user.id) {
      return {
        success: false,
        message:
          'You are the creator of the event, you cannot accept the invitation',
      };
    }
    if (!invitation) {
      return {
        success: false,
        message: 'Invitation not found',
      };
    }
    if (invitation.usersAdded.includes(new mongoose.Types.ObjectId(user.id))) {
      return {
        success: false,
        message: 'You have already accepted the invitation',
      };
    }
    await this.eventInvitationModel.findByIdAndUpdate(invitationId, {
      $push: { usersAdded: new mongoose.Types.ObjectId(user.id) },
    });
    const event = await this.eventModel.findByIdAndUpdate(invitation.event, {
      $push: { participants: new mongoose.Types.ObjectId(user.id) },
    });
    if (event) {
      return {
        success: true,
        message: 'Invitation accepted successfully',
      };
    } else {
      return {
        success: false,
        message: 'Assosiated event not found',
      };
    }
  }

  async declineInvitation(eventId: string, user: DecodedUser) {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }
    if (event.user.toString() === user.id) {
      return {
        success: false,
        message: 'You are the creator of the event, you cannot decline',
      };
    }
    if (!event.participants.includes(new mongoose.Types.ObjectId(user.id))) {
      return {
        success: false,
        message: 'You are not a participant of this event',
      };
    }
    await this.eventModel.findByIdAndUpdate(eventId, {
      $pull: { participants: new mongoose.Types.ObjectId(user.id) },
    });
    await this.eventInvitationModel.findOneAndUpdate(
      { event: new mongoose.Types.ObjectId(eventId) },
      {
        $pull: { usersAdded: new mongoose.Types.ObjectId(user.id) },
      },
    );
    await this.eventResponseModel.deleteOne({
      user: new mongoose.Types.ObjectId(user.id),
      event: new mongoose.Types.ObjectId(eventId),
    });
    return {
      success: true,
      message: 'Invitation declined successfully',
    };
  }

  async rsvpResponse(userId: string, eventId: string, response: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    const foundEvent = await this.eventModel.findById(eventId);
    if (!foundEvent) {
      return {
        success: false,
        message: 'Event not found',
      };
    }
    const alreadyResponded = await this.eventResponseModel.findOne({
      user: user._id,
      event: foundEvent._id,
    });
    if (alreadyResponded) {
      const updatedResponse = await this.eventResponseModel.findByIdAndUpdate(
        alreadyResponded.id,
        {
          $set: { response },
        },
        { new: true },
      );
      return {
        success: true,
        data: updatedResponse,
        message: 'Response updated successfully',
      };
    } else {
      const createdResponse = await this.eventResponseModel.create({
        user: user._id,
        event: foundEvent._id,
        response,
      });
      await this.eventModel.findByIdAndUpdate(eventId, {
        $push: { responses: createdResponse._id },
      });
      return {
        success: true,
        data: createdResponse,
        message: 'Response submitted successfully',
      };
    }
  }

  async getEventRsvp(eventId: string, user: DecodedUser) {
    const event = await this.eventModel
      .findById(eventId)
      .populate('participants', UserPopulates.FOREIGN);
    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }
    if (event.creatorType === BusinessProfile.name) {
      if (event.businessProfile.toString() !== user.businessProfile) {
        return {
          success: false,
          message: 'You are not authorized to access this event',
        };
      }
    } else {
      if (event.user.toString() !== user.id) {
        return {
          success: false,
          message: 'You are not authorized to access this event',
        };
      }
    }
    const responses = await this.eventResponseModel
      .find({ event: new mongoose.Types.ObjectId(eventId) })
      .populate('user', UserPopulates.FOREIGN)
      .exec();

    const going = [];
    const maybe = [];
    const notGoing = [];
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      if (response.response === RSVPTypes.GOING) {
        going.push(response.user);
      }
      if (response.response === RSVPTypes.MAYBE) {
        maybe.push(response.user);
      }
      if (response.response === RSVPTypes.NOT_GOING) {
        notGoing.push(response.user);
      }
    }
    const noReponses = event.participants.filter(
      (participant) =>
        !responses.find(
          (response) =>
            response.user.id.toString() === participant.id.toString(),
        ),
    );
    return {
      success: true,
      message: 'Event RSVP fetched successfully',
      data: {
        going,
        maybe,
        notGoing,
        noResponse: noReponses,
      },
    };
  }

  async postToSocialMedia(businessProfile: string, data: PostToSocialMediaDto) {
    if (!mongoose.isValidObjectId(data.eventId)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const event = await this.eventModel.findById(data.eventId);
      if (!event) {
        return {
          success: false,
          message: 'Event not found with the id provided',
        };
      } else if (event.businessProfile.toString() !== businessProfile) {
        return {
          success: false,
          message: 'You are not authorized to post this event',
        };
      } else {
        const business =
          await this.businessProfileModel.findById(businessProfile);
        if (data.facebook) {
          if (!business.isFacebookConnected) {
            return {
              success: false,
              message: 'Please connect to facebook to post',
            };
          } else {
            //If age is greater than 60 days, ask for re-authentication
            const age =
              new Date().getTime() - business.facebookToken.age.getTime();
            if (age > 5184000000) {
              return {
                success: false,
                message: 'Please re-authenticate with facebook',
              };
            }
            const content =
              event.title + '\n' + event.description ? event.description : '';
            let tempIds = [];
            const eventMedia = await this.imageModel.find({ event: event._id });
            if (eventMedia.length) {
              for (let i = 0; i < eventMedia.length; i++) {
                const media = eventMedia[i];
                const fbId = await this.facebookService.uploadImage(
                  business.facebookToken.value,
                  media.url,
                );
                if (fbId.success) {
                  tempIds.push(fbId.data.id);
                }
              }
            }
            const post = await this.facebookService.createSocialPost(
              business.facebookToken.value,
              content,
              tempIds,
            );
            if (post.success) {
              const result = await this.eventModel
                .findByIdAndUpdate(
                  event.id,
                  {
                    $set: {
                      isPostedOnFacebook: true,
                      facebookPostId: post.data.id,
                    },
                  },
                  { new: true },
                )
                .populate('images', ImagePopulates.FOREIGN)
                .populate({
                  path: 'categories',
                  select: CategoryPopulates.FOREIGN,
                })
                .populate('user', UserPopulates.FOREIGN)
                .populate('businessProfile', BusinessPopulates.FOREIGN);
              return {
                success: true,
                data: result,
                message: 'Event posted to facebook successfully',
              };
            } else {
              return {
                success: false,
                message: 'Error posting to facebook',
              };
            }
          }
        }
        if (data.instagram) {
          if (!business.isInstagramConnected) {
            return {
              success: false,
              message: 'Please connect to instagram to post',
            };
          }
        }
        if (data.twitter) {
          if (!business.isXConnected) {
            return {
              success: false,
              message: 'Please connect to twitter to post',
            };
          }
        }
      }
    }
  }

  async getTemplates(user: DecodedUser) {
    if (user.isBusiness) {
      const templates = await this.templateModel.find({
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
      });
      return {
        success: true,
        message: 'Templates fetched successfully',
        templates,
      };
    } else {
      const templates = await this.templateModel.find({
        user: new mongoose.Types.ObjectId(user.id),
      });
      return {
        success: true,
        message: 'Templates fetched successfully',
        templates,
      };
    }
  }

  async getTemplate(id: string, user: DecodedUser) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid template id',
      };
    } else {
      const template = await this.templateModel
        .findById(id)
        .populate('images', ImagePopulates.FOREIGN)
        .populate('ageGroupsAllowed', 'name')
        .populate('category', CategoryPopulates.FOREIGN)
        .populate('user', UserPopulates.FOREIGN)
        .populate('businessProfile', BusinessPopulates.FOREIGN);
      if (!template) {
        return {
          success: false,
          message: 'Template not found',
        };
      }
      if (template.creatorType === BusinessProfile.name) {
        if (template.businessProfile._id.toString() !== user.businessProfile) {
          return {
            success: false,
            message: 'You are not authorized to access this template',
          };
        }
      } else {
        if (template.user._id.toString() !== user.id) {
          return {
            success: false,
            message: 'You are not authorized to access this template',
          };
        }
      }
      return {
        success: true,
        message: 'Template fetched successfully',
        template,
      };
    }
  }

  async deleteTemplate(id: string, user: DecodedUser) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid template id',
      };
    } else {
      const template = await this.templateModel.findById(id);
      if (!template) {
        return {
          success: false,
          message: 'Template not found',
        };
      }
      if (template.creatorType === BusinessProfile.name) {
        if (template.businessProfile.toString() !== user.businessProfile) {
          return {
            success: false,
            message: 'You are not authorized to delete this template',
          };
        }
      } else {
        if (template.user.toString() !== user.id) {
          return {
            success: false,
            message: 'You are not authorized to delete this template',
          };
        }
      }
      await this.templateModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Template deleted successfully',
      };
    }
  }

  async toggleSaveEvent(eventId: string, userId: string) {
    if (!mongoose.isValidObjectId(eventId)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const event = await this.eventModel.findById(eventId);
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      } else {
        const user = await this.userModel.findById(userId);
        if (!user) {
          return {
            success: false,
            message: 'User not found',
          };
        } else {
          const saved = user.savedEvents.includes(event._id);
          if (saved) {
            await this.userModel.findByIdAndUpdate(userId, {
              $pull: { savedEvents: event._id },
            });
            return {
              success: true,
              message: 'Event removed from saved events',
              saved: false,
            };
          } else {
            await this.userModel.findByIdAndUpdate(userId, {
              $push: { savedEvents: event._id },
            });
            return {
              success: true,
              message: 'Event added to saved events',
              saved: true,
            };
          }
        }
      }
    }
  }

  // async getSavedEvents(
  //   userId: string,
  //   type: string,
  //   latitude: number,
  //   longitude: number,
  //   // page: number,
  //   // limit: number,
  // ) {
  //   const user = await this.userModel.findById(userId);
  //   if (!user) {
  //     return {
  //       success: false,
  //       message: 'User not found',
  //     };
  //   } else {
  //     let searchQuery = {};
  //     if (type == 'all') {
  //       searchQuery = {
  //         'schedule.date': { $gte: new Date() },
  //       };
  //     } else {
  //       searchQuery = {
  //         type: type,
  //         'schedule.date': { $gte: new Date() },
  //       };
  //     }
  //     // {
  //     //   type: EventTypes.PRIVATE,
  //     //   user: new mongoose.Types.ObjectId(userId),
  //     // }
  //     const events = await this.eventModel
  //       .find({
  //         $or: [
  //           {
  //             type: EventTypes.PRIVATE,
  //             user: new mongoose.Types.ObjectId(userId),
  //             // 'schedule.date': { $gte: new Date() },
  //           },
  //           {
  //             _id: {
  //               $in: user.savedEvents,
  //               // 'schedule.date': { $gte: new Date() },
  //             },
  //           },
  //         ],
  //       })
  //       .populate('user', UserPopulates.FOREIGN)
  //       .populate('businessProfile', BusinessPopulates.FOREIGN)
  //       .populate('images', ImagePopulates.FOREIGN)
  //       .populate('locations')
  //       .populate('ageGroupsAllowed', 'name')
  //       .populate('category', CategoryPopulates.FOREIGN)
  //       .sort({ createdAt: -1 })
  //       // .skip((page - 1) * limit)
  //       // .limit(limit)
  //       .exec();
  //     let eventsData = [];
  //     let offersData = [];
  //     let privateEvents = [];
  //     for (let i = 0; i < events.length; i++) {
  //       const event = JSON.parse(JSON.stringify(events[i]));
  //       event['distance'] = event.locations.length
  //         ? haversineDistance(
  //             latitude,
  //             longitude,
  //             event.locations[0].location.coordinates[1],
  //             event.locations[0].location.coordinates[0],
  //           )
  //         : 0;
  //       const isSaved = await this.userService.isEventSaved(
  //         events[i].id,
  //         user.id,
  //       );
  //       const isLiked = await this.userService.isEventLiked(
  //         events[i].id,
  //         user.id,
  //       );
  //       if (events[i].creatorType === 'User') {
  //         const creator = await this.userModel.findById(
  //           events[i].user['_id'].toString(),
  //         );
  //         const isFollowedByMe = await this.followModel.findOne({
  //           followerType: User.name,
  //           follower: new mongoose.Types.ObjectId(user.id),
  //           followingType: User.name,
  //           following: creator._id,
  //           isBlocked: false,
  //         });
  //         event['creatorDetails'] = {
  //           _id: creator._id,
  //           name: creator.name,
  //           profilePhoto: creator.profilePhoto,
  //           email: creator.email,
  //           bio: '',
  //           phone: creator.phone,
  //           website: '',
  //           followersCount: creator.followersCount,
  //           profileType: 'User',
  //           following: isFollowedByMe ? true : false,
  //           isMe: creator.id == user.id,
  //         };
  //       } else {
  //         const businessProfile = await this.businessProfileModel.findById(
  //           events[i].businessProfile._id.toString(),
  //         );
  //         const isFollowedByMe = await this.followModel.findOne({
  //           followerType: User.name,
  //           follower: new mongoose.Types.ObjectId(user.id),
  //           followingType: BusinessProfile.name,
  //           following: businessProfile._id,
  //           isBlocked: false,
  //         });
  //         event['creatorDetails'] = {
  //           _id: businessProfile._id,
  //           name: businessProfile.name,
  //           profilePhoto: businessProfile.profilePhoto,
  //           email: businessProfile.email,
  //           phone: businessProfile.phone,
  //           website: businessProfile.website,
  //           bio: businessProfile.bio,
  //           followersCount: businessProfile.followersCount,
  //           profileType: 'BusinessProfile',
  //           following: isFollowedByMe ? true : false,
  //           isMe: businessProfile.id == user.id,
  //         };
  //       }
  //       if (
  //         events[i].type == EventTypes.FORMAL ||
  //         events[i].type == EventTypes.INFORMAL
  //       ) {
  //         eventsData.push({ ...event, isSaved, isLiked });
  //       } else if (events[i].type == EventTypes.OFFER) {
  //         offersData.push({ ...event, isSaved, isLiked });
  //       } else if (events[i].type == EventTypes.PRIVATE) {
  //         privateEvents.push({ ...event, isSaved, isLiked });
  //       }
  //     }
  // const liked = await this.getLikedEvents(
  //   userId,
  //   type,
  //   latitude,
  //   longitude,
  // );
  //     return {
  //       success: true,
  //       message: 'Saved events fetched successfully',
  //       data: {
  //         events: eventsData,
  //         offers: offersData,
  //         privateEvents: privateEvents,
  //         liked: liked.events,
  //       },
  //     };
  //   }
  // }

  async getSavedEvents(
    userId: string,
    type: string,
    latitude: number,
    longitude: number,
    // page: number,
    // limit: number,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    } else {
      const searchQuery: any = {
        $or: [
          {
            'event.type': EventTypes.PRIVATE,
            'event.participants': new mongoose.Types.ObjectId(userId),
          },
          {
            'event._id': {
              $in: user.savedEvents,
            },
          },
        ],
        'event.schedule.date': { $gte: getZeroDateTz(new Date()) },
        'event.schedule.durations.endTime': { $gte: currentDateTz() },
      };

      if (type !== 'all') {
        searchQuery.type = type;
      }
      const result = await this.eventLocationModel.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
            distanceField: 'distance',
            maxDistance: 10000000000,
            spherical: true,
          },
        },
        {
          $lookup: {
            from: 'events',
            localField: 'event',
            foreignField: '_id',
            as: 'event',
          },
        },
        { $unwind: '$event' },
        {
          $match: {
            'event.status': EventStatus.PUBLISHED,
            ...searchQuery,
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'event.categories',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $lookup: {
            from: 'images',
            localField: 'event.images',
            foreignField: '_id',
            as: 'images',
          },
        },
        {
          $lookup: {
            from: 'eventlocations',
            localField: 'event.locations',
            foreignField: '_id',
            as: 'locations',
          },
        },
        {
          $lookup: {
            from: 'agegroups',
            localField: 'event.ageGroupsAllowed',
            foreignField: '_id',
            as: 'ageGroupsAllowed',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'event.user',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $unwind: '$userDetails' },
        {
          $lookup: {
            from: 'businessprofiles',
            localField: 'event.businessProfile',
            foreignField: '_id',
            as: 'businessProfileDetails',
          },
        },
        {
          $unwind: {
            path: '$businessProfileDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $expr: {
              $cond: {
                if: {
                  $eq: [{ $ifNull: ['$businessProfileDetails', null] }, null],
                },
                then: {},
                else: {
                  $eq: ['$businessProfileDetails.isDeleted', false],
                },
              },
            },
          },
        },
        // {
        //   $lookup: {
        //     from: 'users',
        //     localField: 'event._id',
        //     foreignField: 'savedEvents',
        //     as: 'savedEvents',
        //   },
        // },
        // {
        //   $match: {
        //     'savedEvents._id': userId,
        //   },
        // },
        {
          $lookup: {
            from: 'users',
            localField: 'event._id',
            foreignField: 'likedEvents',
            as: 'likedEvents',
          },
        },
        {
          $addFields: {
            // isSaved: {
            //   $in: [userId, '$savedEvents._id'],
            // },
            isSaved: true,
            isLiked: {
              $in: [userId, '$likedEvents._id'],
            },
            'event.isFollowedByMe': {
              $cond: {
                if: { $eq: ['$event.creatorType', 'User'] },
                then: {
                  $cond: {
                    if: {
                      $ne: [
                        null,
                        {
                          $first: {
                            $filter: {
                              input: '$event.follows',
                              as: 'follow',
                              cond: {
                                $and: [
                                  { $eq: ['$$follow.follower', userId] },
                                  { $eq: ['$$follow.followerType', 'User'] },
                                  {
                                    $eq: [
                                      '$$follow.following',
                                      '$userDetails._id',
                                    ],
                                  },
                                  { $eq: ['$$follow.followingType', 'User'] },
                                  { $eq: ['$$follow.isBlocked', false] },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
                else: {
                  $cond: {
                    if: {
                      $ne: [
                        null,
                        {
                          $first: {
                            $filter: {
                              input: '$event.follows',
                              as: 'follow',
                              cond: {
                                $and: [
                                  { $eq: ['$$follow.follower', userId] },
                                  { $eq: ['$$follow.followerType', 'User'] },
                                  {
                                    $eq: [
                                      '$$follow.following',
                                      '$businessProfileDetails._id',
                                    ],
                                  },
                                  {
                                    $eq: [
                                      '$$follow.followingType',
                                      'BusinessProfile',
                                    ],
                                  },
                                  { $eq: ['$$follow.isBlocked', false] },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            distance: { $divide: ['$distance', 1000] },
            'event._id': 1,
            'event.title': 1,
            'event.creatorType': 1,
            'event.keywords': 1,
            'event.description': 1,
            'event.schedule': 1,
            'event.locations': {
              $map: {
                input: '$locations',
                as: 'location',
                in: {
                  _id: '$$location._id',
                  location: '$$location.location',
                  businessLocationId: '$$location.businessLocationId',
                  accuracy: '$$location.accuracy',
                  address1: '$$location.address1',
                  address2: '$$location.address2',
                  city: '$$location.city',
                  state: '$$location.state',
                  zip: '$$location.zip',
                  website: '$$location.website',
                  email: '$$location.email',
                  phone: '$$location.phone',
                },
              },
            },
            'event.type': 1,
            'event.status': 1,
            'event.targetGenders': 1,
            'event.promotionCode': 1,
            'event.isFree': 1,
            'event.participationCost': 1,
            'event.bookingUrl': 1,
            'event.notifyFollowers': 1,
            'event.RSVP': 1,
            'event.termsApplied': 1,
            'event.termsAndConditions': 1,
            'event.facebookPostId': 1,
            'event.specifyForEachDay': 1,
            'event.participants': 1,
            'event.creatorDetails': {
              $cond: {
                if: { $eq: ['$event.creatorType', 'User'] },
                then: {
                  _id: '$userDetails._id',
                  name: '$userDetails.name',
                  profilePhoto: '$userDetails.profilePhoto',
                  email: '$userDetails.email',
                  bio: '$userDetails.bio',
                  followersCount: '$userDetails.followersCount',
                  profileType: 'User',
                  phone: '$userDetails.phone',
                  website: '',
                  isFollowedByMe: '$event.isFollowedByMe',
                },
                else: {
                  _id: '$businessProfileDetails._id',
                  name: '$businessProfileDetails.name',
                  profilePhoto: '$businessProfileDetails.profilePhoto',
                  email: '$businessProfileDetails.email',
                  bio: '$businessProfileDetails.bio',
                  followersCount: '$businessProfileDetails.followersCount',
                  profileType: 'BusinessProfile',
                  phone: '$businessProfileDetails.phone',
                  website: '$businessProfileDetails.website',
                  isFollowedByMe: '$event.isFollowedByMe',
                },
              },
            },
            'category._id': 1,
            'category.name': 1,
            'category.image': 1,
            images: { _id: 1, url: 1 },
            ageGroupsAllowed: { _id: 1, name: 1 },
            isSaved: 1,
            isLiked: 1,
          },
        },
        {
          $group: {
            _id: '$event._id',
            locationId: { $first: '$_id' },
            distance: { $min: '$distance' },
            title: { $first: '$event.title' },
            creatorType: { $first: '$event.creatorType' },
            keywords: { $first: '$event.keywords' },
            description: { $first: '$event.description' },
            schedule: { $first: '$event.schedule' },
            locations: { $first: '$event.locations' },
            type: { $first: '$event.type' },
            status: { $first: '$event.status' },
            targetGenders: { $first: '$event.targetGenders' },
            promotionCode: { $first: '$event.promotionCode' },
            isFree: { $first: '$event.isFree' },
            participationCost: { $first: '$event.participationCost' },
            bookingUrl: { $first: '$event.bookingUrl' },
            notifyFollowers: { $first: '$event.notifyFollowers' },
            RSVP: { $first: '$event.RSVP' },
            termsApplied: { $first: '$event.termsApplied' },
            termsAndConditions: { $first: '$event.termsAndConditions' },
            facebookPostId: { $first: '$event.facebookPostId' },
            specifyForEachDay: { $first: '$event.specifyForEachDay' },
            participants: { $first: '$event.participants' },
            creatorDetails: { $first: '$event.creatorDetails' },
            category: { $first: '$category' },
            images: { $first: '$images' },
            ageGroupsAllowed: { $first: '$ageGroupsAllowed' },
            isSaved: { $first: '$isSaved' },
            isLiked: { $first: '$isLiked' },
          },
        },
        {
          $addFields: {
            schedule: {
              $filter: {
                input: '$schedule',
                as: 'sched',
                cond: {
                  $or: [
                    { $gte: ['$$sched.date', currentDateTz()] }, // today or future
                    { $eq: ['$$sched.date', currentDateTz()] }, // explicitly today
                  ],
                  // $or: [
                  //   { $gte: ['$$sched.date', start] },
                  // {
                  // $and: [
                  //   { $gte: ['$$sched.date', currentDateTz()] },
                  //   {
                  //     $anyElementTrue: {
                  //       $map: {
                  //         input: '$$sched.durations',
                  //         as: 'duration',
                  //         in: { $gte: ['$$duration.endTime', currentDateTz()] },
                  //       },
                  //     },
                  //   },
                  // ],
                  // },
                  // ],
                },
              },
            },
            distance: {
              $round: ['$distance', 2],
            },
          },
        },
        {
          $sort: {
            distance: 1,
            // 'schedule.durations.startTime': 1, // sort by start time in ascending order
            //soonest to latest
            'schedule.0.durations.0.startTime': 1,
          },
        },

        // {
        //   $skip: !page ? 0 : (page - 1) * limit,
        // },
        // {
        //   $limit: limit,
        // },
      ]);
      // console.log('result', result);
      // Post-processing to group events into distance batches and sort them accordingly
      result.forEach((event) => {
        event.locations.forEach((location) => {
          location.distance = haversineDistance(
            latitude,
            longitude,
            location.location.coordinates[1],
            location.location.coordinates[0],
          );
        });
        // Sort locations by distance
        event.locations.sort((a, b) => a.distance - b.distance);
      });
      result.sort((a, b) => {
        if (a.schedule[0] && b.schedule[0]) {
          if (a.schedule[0].durations[0] && b.schedule[0].durations[0]) {
            const aTime = new Date(
              a.schedule[0].durations[0].startTime,
            ).getTime();
            const bTime = new Date(
              b.schedule[0].durations[0].startTime,
            ).getTime();
            return aTime - bTime;
          }
        }
        return 0;
      });

      let eventsData = [];
      let offersData = [];
      let privateEvents = [];
      //Remove the schedules from the events that have passed
      const events = result.map((event) => {
        const schedule = event.schedule.filter((sched) => {
          const durations = sched.durations.filter((duration) => {
            return new Date(duration.endTime) > currentDateTz();
          });
          return durations.length > 0;
        });
        return {
          ...event,
          schedule,
        };
      });
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (
          event.type == EventTypes.FORMAL ||
          event.type == EventTypes.INFORMAL
        ) {
          eventsData.push(event);
        } else if (event.type == EventTypes.OFFER) {
          offersData.push(event);
        } else if (event.type == EventTypes.PRIVATE) {
          privateEvents.push(event);
        }
      }
      privateEvents.sort((a, b) => {
        if (a.schedule[0] && b.schedule[0]) {
          if (a.schedule[0].durations[0] && b.schedule[0].durations[0]) {
            const aTime = new Date(
              a.schedule[0].durations[0].startTime,
            ).getTime();
            const bTime = new Date(
              b.schedule[0].durations[0].startTime,
            ).getTime();
            return aTime - bTime;
          }
        }
        return 0;
      });
      const likedEvents = await this.getLikedEvents(
        userId,
        type,
        latitude,
        longitude,
      );
      //Sort the liked events by schedule as above logic and store in likedEventsData
      const likedEventsData = likedEvents.events.map((event) => {
        const schedule = event.schedule.filter((sched) => {
          const durations = sched.durations.filter((duration) => {
            return new Date(duration.endTime) > currentDateTz();
          });
          return durations.length > 0;
        });
        return {
          ...event,
          schedule,
        };
      });
      likedEventsData.sort((a, b) => {
        if (a.schedule[0] && b.schedule[0]) {
          if (a.schedule[0].durations[0] && b.schedule[0].durations[0]) {
            const aTime = new Date(
              a.schedule[0].durations[0].startTime,
            ).getTime();
            const bTime = new Date(
              b.schedule[0].durations[0].startTime,
            ).getTime();
            return aTime - bTime;
          }
        }
        return 0;
      });

      return {
        success: true,
        message: 'Saved events fetched successfully',
        data: {
          events: eventsData,
          offers: offersData,
          privateEvents: privateEvents,
          liked: likedEvents.events,
        },
      };
    }
  }

  async closeEvent(
    id: string,
    user: DecodedUser,
  ): Promise<{ success: boolean; message: string; status?: string }> {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const event = await this.eventModel.findById(id);
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      }
      if (
        event.creatorType === BusinessProfile.name &&
        event.businessProfile.toString() !== user.businessProfile
      ) {
        return {
          success: false,
          message: 'You are not authorized to close this event',
        };
      } else if (
        event.creatorType === User.name &&
        event.user.toString() !== user.id
      ) {
        return {
          success: false,
          message: 'You are not authorized to close this event',
        };
      } else {
        await this.eventModel.findByIdAndUpdate(id, {
          status: EventStatus.CLOSED,
        });
        return {
          success: true,
          message: 'Event closed successfully',
          status: EventStatus.CLOSED,
        };
      }
    }
  }

  async copyEvent(id: string, user: DecodedUser, expired: boolean) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const event = await this.eventModel.findById(id).lean();
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      }
      if (
        event.creatorType === BusinessProfile.name &&
        event.businessProfile.toString() !== user.businessProfile
      ) {
        return {
          success: false,
          message: 'You are not authorized to copy this event',
        };
      } else if (
        event.creatorType === User.name &&
        event.user.toString() !== user.id
      ) {
        return {
          success: false,
          message: 'You are not authorized to copy this event',
        };
      } else {
        const eventObj = { ...event };
        delete eventObj['status'];
        delete eventObj['_id'];
        delete eventObj['createdAt'];
        delete eventObj['updatedAt'];
        delete eventObj['images'];

        if (expired) {
          delete eventObj['schedule'];
          eventObj['schedule'] = [];
        }

        //write a logic to remove the schedules that have passed i.e. either the date is in the past or the duration end time is past
        let schedules = [];
        for (let i = 0; i < event.schedule.length; i++) {
          const schedule = event.schedule[i];
          if (schedule.date >= getZeroDateTz(new Date())) {
            let durations = [];
            for (let j = 0; j < schedule.durations.length; j++) {
              const duration = schedule.durations[j];
              if (new Date(duration.endTime) > currentDateTz()) {
                durations.push(duration);
              }
            }
            if (durations.length) {
              schedules.push({ ...schedule, durations });
            }
          }
        }
        eventObj['schedule'] = schedules;
        delete eventObj['responses'];
        eventObj['participants'] = [];
        const copiedEvent = await this.eventModel.create({
          status: EventStatus.DRAFTED,
          ...eventObj,
        });
        let locations = [];
        if (event.locations.length) {
          for (let i = 0; i < event.locations.length; i++) {
            const location = await this.eventLocationModel
              .findById(event.locations[i])
              .lean();
            if (location) {
              const locationObj = { ...location };
              delete locationObj['_id'];
              delete locationObj['createdAt'];
              delete locationObj['updatedAt'];
              const copiedLocation = await this.eventLocationModel.create({
                ...locationObj,
                event: copiedEvent._id,
              });
              locations.push(copiedLocation._id);
            }
          }
        }
        if (locations.length) {
          await this.eventModel.findByIdAndUpdate(copiedEvent._id, {
            $set: { locations },
          });
        }
        let images = [];
        if (event.images.length) {
          for (let i = 0; i < event.images.length; i++) {
            const image = await this.imageModel
              .findById(event.images[i])
              .lean();
            if (image) {
              const imageObj = { ...image };
              delete imageObj['_id'];
              delete imageObj['createdAt'];
              delete imageObj['updatedAt'];
              const copiedImage = await this.imageModel.create({
                ...imageObj,
                event: copiedEvent._id,
              });
              images.push(copiedImage._id);
            }
          }
        }
        if (images.length) {
          await this.eventModel.findByIdAndUpdate(copiedEvent._id, {
            $push: { images: { $each: images } },
          });
        }
        const updatedEvent = await this.eventModel
          .findById(copiedEvent._id)
          .populate('images', ImagePopulates.FOREIGN)
          .populate('locations', LocationPopulates.FOREIGN)
          .populate('ageGroupsAllowed', '_id id name');
        return {
          success: true,
          message: 'Event copied successfully',
          event: updatedEvent,
        };
      }
    }
  }

  async likeEvent(
    eventId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; liked?: boolean }> {
    if (!mongoose.isValidObjectId(eventId)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const event = await this.eventModel.findById(eventId);
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      } else {
        const user = await this.userModel.findById(userId);
        if (!user) {
          return {
            success: false,
            message: 'User not found',
          };
        } else {
          const liked = user.likedEvents.includes(event._id);
          if (liked) {
            await this.userModel.findByIdAndUpdate(userId, {
              $pull: { likedEvents: event._id },
            });
            return {
              success: true,
              message: 'Event removed from liked events',
              liked: false,
            };
          } else {
            await this.userModel.findByIdAndUpdate(userId, {
              $push: { likedEvents: event._id },
            });
            return {
              success: true,
              message: 'Event added to liked events',
              liked: true,
            };
          }
        }
      }
    }
  }

  async getLikedEvents(
    userId: string,
    type: string,
    latitude: number,
    longitude: number,
    // page: number,
    // limit: number,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    } else {
      let searchQuery = {
        'event._id': { $in: user.likedEvents },
        'event.schedule.date': { $gte: getZeroDateTz(new Date()) },
        'event.schedule.durations.endTime': { $gte: currentDateTz() },
      };
      if (type !== 'all') {
        searchQuery['event.type'] = type;
      }
      const events = await this.eventLocationModel.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
            distanceField: 'distance',
            maxDistance: 10000000000,
            spherical: true,
          },
        },
        {
          $lookup: {
            from: 'events',
            localField: 'event',
            foreignField: '_id',
            as: 'event',
          },
        },
        { $unwind: '$event' },
        {
          $match: {
            'event.status': EventStatus.PUBLISHED,
            ...searchQuery,
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'event.categories',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $lookup: {
            from: 'images',
            localField: 'event.images',
            foreignField: '_id',
            as: 'images',
          },
        },
        {
          $lookup: {
            from: 'eventlocations',
            localField: 'event.locations',
            foreignField: '_id',
            as: 'locations',
          },
        },
        {
          $lookup: {
            from: 'agegroups',
            localField: 'event.ageGroupsAllowed',
            foreignField: '_id',
            as: 'ageGroupsAllowed',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'event.user',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $unwind: '$userDetails' },
        {
          $lookup: {
            from: 'businessprofiles',
            localField: 'event.businessProfile',
            foreignField: '_id',
            as: 'businessProfileDetails',
          },
        },
        {
          $unwind: {
            path: '$businessProfileDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $expr: {
              $cond: {
                if: {
                  $eq: [{ $ifNull: ['$businessProfileDetails', null] }, null],
                },
                then: {},
                else: {
                  $eq: ['$businessProfileDetails.isDeleted', false],
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'event._id',
            foreignField: 'likedEvents',
            as: 'likedEvents',
          },
        },
        {
          $addFields: {
            // isSaved: {
            //   $in: [userId, '$savedEvents._id'],
            // },
            isSaved: true,
            isLiked: {
              $in: [userId, '$likedEvents._id'],
            },
            'event.isFollowedByMe': {
              $cond: {
                if: { $eq: ['$event.creatorType', 'User'] },
                then: {
                  $cond: {
                    if: {
                      $ne: [
                        null,
                        {
                          $first: {
                            $filter: {
                              input: '$event.follows',
                              as: 'follow',
                              cond: {
                                $and: [
                                  { $eq: ['$$follow.follower', userId] },
                                  { $eq: ['$$follow.followerType', 'User'] },
                                  {
                                    $eq: [
                                      '$$follow.following',
                                      '$userDetails._id',
                                    ],
                                  },
                                  { $eq: ['$$follow.followingType', 'User'] },
                                  { $eq: ['$$follow.isBlocked', false] },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
                else: {
                  $cond: {
                    if: {
                      $ne: [
                        null,
                        {
                          $first: {
                            $filter: {
                              input: '$event.follows',
                              as: 'follow',
                              cond: {
                                $and: [
                                  { $eq: ['$$follow.follower', userId] },
                                  { $eq: ['$$follow.followerType', 'User'] },
                                  {
                                    $eq: [
                                      '$$follow.following',
                                      '$businessProfileDetails._id',
                                    ],
                                  },
                                  {
                                    $eq: [
                                      '$$follow.followingType',
                                      'BusinessProfile',
                                    ],
                                  },
                                  { $eq: ['$$follow.isBlocked', false] },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            distance: { $divide: ['$distance', 1000] },
            'event._id': 1,
            'event.title': 1,
            'event.creatorType': 1,
            'event.keywords': 1,
            'event.description': 1,
            'event.schedule': 1,
            'event.locations': {
              $map: {
                input: '$locations',
                as: 'location',
                in: {
                  _id: '$$location._id',
                  location: '$$location.location',
                  businessLocationId: '$$location.businessLocationId',
                  accuracy: '$$location.accuracy',
                  address1: '$$location.address1',
                  address2: '$$location.address2',
                  city: '$$location.city',
                  state: '$$location.state',
                  zip: '$$location.zip',
                  website: '$$location.website',
                  email: '$$location.email',
                  phone: '$$location.phone',
                },
              },
            },
            'event.type': 1,
            'event.status': 1,
            'event.targetGenders': 1,
            'event.promotionCode': 1,
            'event.isFree': 1,
            'event.participationCost': 1,
            'event.bookingUrl': 1,
            'event.notifyFollowers': 1,
            'event.RSVP': 1,
            'event.termsApplied': 1,
            'event.termsAndConditions': 1,
            'event.facebookPostId': 1,
            'event.specifyForEachDay': 1,
            'event.participants': 1,
            'event.creatorDetails': {
              $cond: {
                if: { $eq: ['$event.creatorType', 'User'] },
                then: {
                  _id: '$userDetails._id',
                  name: '$userDetails.name',
                  profilePhoto: '$userDetails.profilePhoto',
                  email: '$userDetails.email',
                  bio: '$userDetails.bio',
                  followersCount: '$userDetails.followersCount',
                  profileType: 'User',
                  phone: '$userDetails.phone',
                  website: '',
                  isFollowedByMe: '$event.isFollowedByMe',
                },
                else: {
                  _id: '$businessProfileDetails._id',
                  name: '$businessProfileDetails.name',
                  profilePhoto: '$businessProfileDetails.profilePhoto',
                  email: '$businessProfileDetails.email',
                  bio: '$businessProfileDetails.bio',
                  followersCount: '$businessProfileDetails.followersCount',
                  profileType: 'BusinessProfile',
                  phone: '$businessProfileDetails.phone',
                  website: '$businessProfileDetails.website',
                  isFollowedByMe: '$event.isFollowedByMe',
                },
              },
            },
            'category._id': 1,
            'category.name': 1,
            'category.image': 1,
            images: { _id: 1, url: 1 },
            ageGroupsAllowed: { _id: 1, name: 1 },
            isSaved: 1,
            isLiked: 1,
          },
        },
        {
          $group: {
            _id: '$event._id',
            locationId: { $first: '$_id' },
            distance: { $min: '$distance' },
            title: { $first: '$event.title' },
            creatorType: { $first: '$event.creatorType' },
            keywords: { $first: '$event.keywords' },
            description: { $first: '$event.description' },
            schedule: { $first: '$event.schedule' },
            locations: { $first: '$event.locations' },
            type: { $first: '$event.type' },
            status: { $first: '$event.status' },
            targetGenders: { $first: '$event.targetGenders' },
            promotionCode: { $first: '$event.promotionCode' },
            isFree: { $first: '$event.isFree' },
            participationCost: { $first: '$event.participationCost' },
            bookingUrl: { $first: '$event.bookingUrl' },
            notifyFollowers: { $first: '$event.notifyFollowers' },
            RSVP: { $first: '$event.RSVP' },
            termsApplied: { $first: '$event.termsApplied' },
            termsAndConditions: { $first: '$event.termsAndConditions' },
            facebookPostId: { $first: '$event.facebookPostId' },
            specifyForEachDay: { $first: '$event.specifyForEachDay' },
            participants: { $first: '$event.participants' },
            creatorDetails: { $first: '$event.creatorDetails' },
            category: { $first: '$category' },
            images: { $first: '$images' },
            ageGroupsAllowed: { $first: '$ageGroupsAllowed' },
            isSaved: { $first: '$isSaved' },
            isLiked: { $first: '$isLiked' },
          },
        },
        {
          $addFields: {
            schedule: {
              $filter: {
                input: '$schedule',
                as: 'sched',
                cond: {
                  $or: [
                    { $gte: ['$$sched.date', currentDateTz()] }, // Include today or future
                    { $eq: ['$$sched.date', currentDateTz()] }, // Specifically today
                  ],
                  // $or: [
                  //   { $gte: ['$$sched.date', start] },
                  // {
                  // $and: [
                  //   { $gte: ['$$sched.date', currentDateTz()] },
                  //   {
                  //     $anyElementTrue: {
                  //       $map: {
                  //         input: '$$sched.durations',
                  //         as: 'duration',
                  //         in: { $gte: ['$$duration.endTime', currentDateTz()] },
                  //       },
                  //     },
                  //   },
                  // ],
                  // },
                  // ],
                },
              },
            },
            distance: {
              $round: ['$distance', 2],
            },
          },
        },
        {
          $sort: {
            distance: 1,
            'schedule.durations.startTime': 1,
          },
        },
      ]);
      return {
        success: true,
        message: 'Liked events fetched successfully',
        events,
      };
    }
  }

  async deleteEvent(id: string, user: DecodedUser) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const event = await this.eventModel.findById(id);
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      }
      if (
        event.creatorType === BusinessProfile.name &&
        event.businessProfile.toString() !== user.businessProfile
      ) {
        return {
          success: false,
          message: 'You are not authorized to delete this event',
        };
      } else if (
        event.creatorType === User.name &&
        event.user.toString() !== user.id
      ) {
        return {
          success: false,
          message: 'You are not authorized to delete this event',
        };
      } else {
        await this.eventModel.findByIdAndDelete(id);
        await this.imageModel.deleteMany({
          event: new mongoose.Types.ObjectId(id),
        });
        await this.eventLocationModel.deleteMany({
          event: new mongoose.Types.ObjectId(id),
        });
        await this.eventInvitationModel.deleteMany({
          event: new mongoose.Types.ObjectId(id),
        });
        await this.reportModel.deleteMany({
          event: new mongoose.Types.ObjectId(id),
        });

        return {
          success: true,
          message: 'Event deleted successfully',
        };
      }
    }
  }

  async reportEvent(userId: string, data: ReportEventDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    const event = await this.eventModel.findById(data.event);
    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }
    data.event = event._id;
    const report = await this.reportModel.create({
      user: new mongoose.Types.ObjectId(userId),
      ...data,
    });
    return {
      success: true,
      message: 'Event reported successfully',
      report,
    };
  }

  async getReports(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    const reports = await this.reportModel
      .find({ user: new mongoose.Types.ObjectId(userId) })
      .populate('event', '_id title')
      .sort({ createdAt: -1 })
      .select({ __v: 0, updatedAt: 0, user: 0 });

    return {
      success: true,
      message: 'Reports fetched successfully',
      reports,
    };
  }

  async generateUniqueEventCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < 15; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }
    const event = await this.eventModel.findOne({ uniqueCode: randomString });
    if (event) {
      return await this.generateUniqueEventCode();
    } else {
      return randomString;
    }
  }

  async createSchedule(
    eventId: string,
    data: CreateScheduleDto,
    user: DecodedUser,
  ) {
    try {
      let profile = null;
      if (user.userType === UserTypes.USER) {
        profile = await this.userModel.findById(user.id);
      } else if (user.userType === UserTypes.BUSINESS) {
        profile = await this.businessUserModel.findById(user.id);
      }
      if (!profile) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      const event = await this.eventModel.findById(eventId);
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      }
      if (
        event.user.toString() !== user.id ||
        event.businessProfile.toString() !== user.businessProfile
      ) {
        return {
          success: false,
          message: 'You are not authorized to create schedule for this event',
        };
      }
      let scheduleList = [];
      if (data.scheduleType) {
        if (
          data.scheduleType == ScheduleTypes.FIXED &&
          data.fixedSchedule &&
          data.fixedSchedule.length
        ) {
          //Parse dates into date objects and also sort the dates and their respective durations in ascending order
          for (let i = 0; i < data.fixedSchedule.length; i++) {
            if (data.fixedSchedule[i].date) {
              data.fixedSchedule[i].date = new Date(
                data.fixedSchedule[i].date.toString(),
              );
              if (new Date(data.fixedSchedule[i].date.toString()).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)) {
                return {
                  success: false,
                  message: `Date cannot be in past for the date ${data.fixedSchedule[i].date}`,
                };
              }

              for (let j = 0; j < data.fixedSchedule[i].durations.length; j++) {
                const duration = data.fixedSchedule[i].durations[j];
                if (duration) {
                  const isValid = this.isValidTimeRange(
                    duration.startHour,
                    duration.startMinute,
                    duration.endHour,
                    duration.endMinute,
                  );
                  if (!isValid) {
                    return {
                      success: false,
                      message: `Start time cannot be greater than end time for the date ${data.fixedSchedule[i].date} and duration at index ${j}`,
                    };
                  }
                }
              }

              data.fixedSchedule[i].durations.sort((a, b) => {
                return (
                  a.startHour * 60 +
                  a.startMinute -
                  (b.startHour * 60 + b.startMinute)
                );
              });
            }
            data.fixedSchedule.sort((a, b) => {
              return a.date - b.date;
            });
          }
          console.log('Fix 1:');

          for (let i = 0; i < data.fixedSchedule.length; i++) {
            if (data.fixedSchedule[i].date) {
              const date = new Date(data.fixedSchedule[i].date.toString());
              let scheduleObj = {
                type: data.scheduleType,
                event: new mongoose.Types.ObjectId(eventId),
                fixedSchedule: {
                  date: new Date(date),
                  durations: data.fixedSchedule[i].durations,
                },
              };
              const createdSchedule =
                await this.scheduleModel.create(scheduleObj);
              scheduleList.push(createdSchedule._id);
            }
          }
        } else if (
          data.scheduleType == ScheduleTypes.RECURRING &&
          data.recurringSchedule
        ) {
          console.log('Check:1');
          let startDate = new Date(data.recurringSchedule.startDate);
          let endDate = new Date(data.recurringSchedule.endDate);

          if (startDate < new Date(Date.now())) {
            return {
              success: false,
              message: `Start date cannot be in past`,
            };
          }
          if (endDate < new Date(Date.now())) {
            return {
              success: false,
              message: `End date cannot be in past`,
            };
          }

          data.recurringSchedule.startDate = startDate;
          data.recurringSchedule.endDate = endDate;
          console.log('Check:2', startDate, endDate);
          if (startDate > endDate) {
            return {
              success: false,
              message: `Start date cannot be greater than end date for this schedule`,
            };
          }
          let week = data.recurringSchedule.weekDays;
          for (let i = 0; i < Object.keys(week).length; i++) {
            let day = Object.keys(week)[i];
            let dayObj = week[day];
            console.log('day:', day);
            console.log('Day Data:', dayObj);
            if (dayObj.included) {
              if (dayObj.durations.length == 0) {
                return {
                  success: false,
                  message: `Please provide the duration for the ${day}`,
                };
              }
              //durations array
              for (let j = 0; j < dayObj.durations.length; j++) {
                console.log('Duration:', dayObj.durations[j]);
                let duration = dayObj.durations[j];
                // let startTime = duration.startTime;
                // let endTime = duration.endTime;

                let startHour = duration.startHour;
                let startMinute = duration.startMinute;
                let endHour = duration.endHour;
                let endMinute = duration.endMinute;
                const isValid = this.isValidTimeRange(
                  startHour,
                  startMinute,
                  endHour,
                  endMinute,
                );
                if (!isValid) {
                  return {
                    success: false,
                    message: `Start time cannot be greater than end time for the day ${Object.keys(day)} and duration at index ${j}`,
                  };
                }
              }
              dayObj.durations.sort((a, b) => {
                return (
                  a.startHour * 60 +
                  a.startMinute -
                  (b.startHour * 60 + b.startMinute)
                );
              });
              data.recurringSchedule.weekDays[day] = dayObj;
            }
          }

          let scheduleObj = {
            type: data.scheduleType,
            event: new mongoose.Types.ObjectId(eventId),
            recurringSchedule: {
              startDate: data.recurringSchedule.startDate,
              endDate: data.recurringSchedule.endDate,
              weekDays: data.recurringSchedule.weekDays,
            },
          };
          const createdSchedule = await this.scheduleModel.create(scheduleObj);
          scheduleList.push(createdSchedule._id);
         
        }
        const updatedEvent = await this.eventModel.findByIdAndUpdate(
          eventId,
          {
            $push: {
              eventSchedule: { $each: scheduleList },
            },
          },
          { new: true },
        );
      }
      console.log('Check:3', scheduleList);
      return {
        success: true,
        message: 'Schedule created successfully',
        data: scheduleList,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private async getUserCreatorDetails(userId: string, currentUserId: string) {
    const creator = await this.userModel.findById(userId);
    if (!creator) return null;
  
    const isFollowedByMe = await this.followModel.findOne({
      followerType: User.name,
      follower: new mongoose.Types.ObjectId(currentUserId),
      followingType: User.name,
      following: creator._id,
      isBlocked: false,
    });
  
    return {
      _id: creator._id,
      name: creator.name,
      profilePhoto: creator.profilePhoto,
      email: creator.email,
      phone: creator.phone,
      website: '',
      bio: '',
      followersCount: creator.followersCount,
      profileType: 'User',
      following: !!isFollowedByMe,
      isMe: creator.id === currentUserId,
    };
  }
  
  private async getBusinessCreatorDetails(businessProfileId: string, currentUserId: string) {
    const businessProfile = await this.businessModel.findById(businessProfileId);
    if (!businessProfile) return null;
  
    const isFollowedByMe = await this.followModel.findOne({
      followerType: User.name,
      follower: new mongoose.Types.ObjectId(currentUserId),
      followingType: BusinessProfile.name,
      following: businessProfile._id,
      isBlocked: false,
    });
  
    return {
      _id: businessProfile._id,
      name: businessProfile.name,
      profilePhoto: businessProfile.logo,
      email: businessProfile.email,
      bio: businessProfile.bio,
      phone: businessProfile.phone,
      website: businessProfile.website,
      followersCount: businessProfile.followersCount,
      profileType: 'BusinessProfile',
      following: !!isFollowedByMe,
      isMe: businessProfile.id === currentUserId,
    };
  }
  
  async getCreatedEventsV3(
    user: DecodedUser,
    isExpired: boolean,
    page: number,
    limit: number,
  ) {
    let query = {};
  
    if (user.isBusiness) {
      query = {
        creatorType: BusinessUser.name,
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
      };
    } else {
      query = {
        creatorType: User.name,
        user: new mongoose.Types.ObjectId(user.id),
        type: EventTypes.PRIVATE,
      };
    }
  
    // Fetch event schedules first
    const currentDate = currentDateTz();
    let scheduleQuery: any = {};
  
    if (isExpired) {
      scheduleQuery = {
        $or: [
          { 
            'fixedSchedule.date': { $lt: currentDate } 
          },
          {
            'recurringSchedule.endDate': { $lt: currentDate },
          },
        ],
      };
    } else {
      scheduleQuery = {
        $or: [
          { 
            'fixedSchedule.date': { $gte: currentDate } 
          },
          {
            'recurringSchedule.startDate': { $lte: currentDate },
            'recurringSchedule.endDate': { $gte: currentDate },
          },
        ],
      };
    }
  
    // Find schedules matching the filter
    const eventSchedules = await this.eventScheduleModel.find(scheduleQuery).select('event');
  
    // Extract event IDs
    const eventIds = eventSchedules.map((schedule) => schedule.event);
  
    // Fetch events with matching IDs
    query['_id'] = { $in: eventIds };
  
    console.log('Query when in content management', query);
    const events = await this.eventModel
      .find(query)
      .populate('images', ImagePopulates.FOREIGN)
      .populate('locations', LocationPopulates.FOREIGN)
      .populate('ageGroupsAllowed', 'name')
      .populate({ path: 'categories', select: CategoryPopulates.FOREIGN })
      .populate({
        path: 'user',
        select: UserPopulates.FOREIGN,
      })
      .populate({
        path: 'businessProfile',
        select: BusinessPopulates.FOREIGN,
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  
    let resData = [];
  
    for (const event of events) {
      const eventObj = JSON.parse(JSON.stringify(event));
      const creatorDetails = event.creatorType === 'User'
        ? await this.getUserCreatorDetails((event.user).toString(), user.id)
        : await this.getBusinessCreatorDetails((event.businessProfile).toString(), user.id);
  
      eventObj['creatorDetails'] = creatorDetails;
  
      // Fetch event's schedule data
      const eventSchedule = eventSchedules.find((s) => s.event.equals(event._id));
  
      eventObj['schedule'] = eventSchedule ? eventSchedule.toObject() : null;
      resData.push(eventObj);
    }
  
    // Sorting based on schedule dates
    resData = resData.sort((a, b) => {
      const aDate = a.schedule?.fixedSchedule?.date || a.schedule?.recurringSchedule?.startDate;
      const bDate = b.schedule?.fixedSchedule?.date || b.schedule?.recurringSchedule?.startDate;
  
      if (!aDate || !bDate) return 0;
  
      return isExpired ? new Date(bDate).getTime() - new Date(aDate).getTime()
                       : new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  
    const totalDocs = await this.eventModel.countDocuments(query);
  
    return {
      success: true,
      message: 'Events fetched successfully',
      events: resData,
      total: totalDocs,
      page,
      limit,
      pages: Math.ceil(totalDocs / limit),
    };
  }
  
}
