import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Event, EventDocument } from './models/event.model';
import mongoose, { Model } from 'mongoose';
import axios from '@nestjs/axios';
import { Category, CategoryDocument } from 'src/models/contentCategory.model';
import { Image, ImageDocument } from './models/image.model';
import { User, UserDocument } from 'src/user/models/user.model';
import {
  BadWords,
  CrawledEventStatus,
  EventStatus,
  EventTypes,
  NotificationTypes,
  ReportTypes,
  RSVPTypes,
} from 'src/enums/event.enums';
import { S3Service } from 'src/s3.service';
import { PublishEventDto } from './dto/publishEvent.dto';
import { Template, TemplateDocument } from './models/template.model';
import { PostToSocialMediaDto } from 'src/event/dto/postToSocialMedia.dto';
import { FacebookService } from 'src/user/facebook.service';
import { HttpService } from '@nestjs/axios';
import {
  EventLocation,
  EventLocationDocument,
} from './models/eventLocation.model';
// import {
//   BusinessLocation,
//   BusinessLocationDocument,
//   // Location,
// } from 'src/business-profile/models/businessLocation.model';
import {
  Notification,
  NotificationDocument,
} from 'src/notification/models/notification.model';
import { Follow, FollowDocument } from 'src/user/models/follow.model';
import { UserService } from 'src/user/user.service';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
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
import {
  FileCategoryTypes,
  FileType,
  TokenTypes,
  UserTypes,
} from 'src/enums/auth.enums';
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
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import {
  BusinessUserCreatorType,
  OfferStatus,
} from 'src/business/enums/business.enum';
import { Code } from 'mongodb';
import { CreateOfferDto } from './dto/create-offer.dto';
import { File, FileDocument } from 'src/drive/models/file.model';
import { Folder } from 'src/drive/models/folder.model';
import {
  FileCategory,
  FileCategoryDocument,
} from 'src/drive/models/fileCategory.model';
import { DriveService } from 'src/drive/drive.service';
import { Admin } from 'src/admin/models/admin.model';
import {
  BusinessIndustry,
  BusinessIndustryDocument,
} from 'src/business/model/businessIndustry.model';
import { AtlantaData, ETL_DATA, LubbockData } from './crawledEvents.json';
import {
  BusinessCategory,
  BusinessCategoryDocument,
} from 'src/business/model/businessCategory.model';
import { OutletCategoryList } from 'src/outlet/outlet.enum';
import { Drive } from 'src/drive/models/drive.model';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { LocationClass } from 'src/business/model/types.model';

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
    // @InjectModel(BusinessLocation.name) private readonly businessLocationModel: Model<BusinessLocationDocument>,
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
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(BusinessIndustry.name)
    private readonly businessIndustryModel: Model<BusinessIndustryDocument>,
    @InjectModel(BusinessCategory.name)
    private readonly businessCategoryModel: Model<BusinessCategoryDocument>,
    @InjectModel(EventSchedule.name)
    private readonly eventScheduleModel: Model<EventScheduleDocument>,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(FileCategory.name)
    private readonly fileCategoryModel: Model<FileCategoryDocument>,

    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    private readonly s3Service: S3Service,
    private readonly userService: UserService,
    private readonly facebookService: FacebookService,
    private readonly httpService: HttpService,
    private readonly firebaseService: FirebaseService,
    private readonly dynamicLinkService: DynamicLinkService,
    private readonly driveService: DriveService,
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
    if (eventInfo.creatorType === BusinessUser.name) {
      const businessProfile = await this.businessModel.findById(
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
    const now = new Date();
    const todaysDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    ).toISOString();

    for (let i = 0; i < eventInfo.eventSchedule.length; i++) {
      if (requiredSchedule) {
        break;
      } else {
        const schedule = await this.scheduleModel.findOne({
          _id: eventInfo.eventSchedule[i],
        });
        if (schedule) {
          if (schedule.type == ScheduleTypes.FIXED) {
            if (schedule.fixedSchedule.date >= new Date(todaysDate)) {
              // requiredSchedule = eventInfo.schedule[i];
              let durations = schedule.fixedSchedule.durations;
              for (let j = 0; j < durations.length; j++) {
                console.log('Durations:', durations[j]);
                if (new Date(durations[j].startTime) >= new Date()) {
                  console.log('Start time:', durations[j].startTime);
                  requiredSchedule = durations[j].startTime;
                  break;
                }
                // else {
                //   // return {
                //   //   success: false,
                //   //   message: 'No upcoming schedule found for this event',
                //   // };
                // }
              }
            }
            // else {
            //   return {
            //     success: false,
            //     message: 'No upcoming schedule found for this event',
            //   };
            // }
          }
        }
      }
    }
    if (!requiredSchedule) {
      console.log('No upcoming schedule found');
      return {
        success: false,
        message: 'No upcoming schedule found for this event',
      };
    } else {
      console.log('Required schedule:', requiredSchedule);
    }
    if (eventInfo.eventSchedule.length == 1) {
      eventDescription = getStringDateTzWithTime(new Date(requiredSchedule));
    } else {
      eventDescription =
        getStringDateTzWithTime(new Date(requiredSchedule)) + '(plus more)';
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
    console.log('Title, Description, ImageUrl:', title, description, imageUrl);
    console.log('Success Response:', successResponse);

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
    } else if (
      event.creatorType === BusinessUser.name &&
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
      }
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

    // if (updateEventDto.ageGroupsAllowed) {
    //   if (updateEventDto.ageGroupsAllowed.length) {
    //     await this.eventModel.findByIdAndUpdate(id, {
    //       $set: { ageGroupsAllowed: [] },
    //     });
    //     for (let i = 0; i < updateEventDto.ageGroupsAllowed.length; i++) {
    //       if (!mongoose.isValidObjectId(updateEventDto.ageGroupsAllowed[i])) {
    //         return {
    //           success: false,
    //           message: `Please provide a valid age group id, ${updateEventDto.ageGroupsAllowed[i]} is not valid`,
    //         };
    //       }
    //       const ageGroup = await this.ageGroupModel.findById(
    //         updateEventDto.ageGroupsAllowed[i],
    //       );
    //       if (!ageGroup) {
    //         return {
    //           success: false,
    //           message: `Age group with id ${updateEventDto.ageGroupsAllowed[i]} not found`,
    //         };
    //       }
    //       updateEventDto.ageGroupsAllowed[i] = ageGroup._id;
    //     }
    //   }
    // }

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
            }
            const createdlocation = await this.eventLocationModel.create({
              event: new mongoose.Types.ObjectId(id),
              businessLocationId: outletDoc._id,
              businessProfile: event.businessProfile,
              location: {
                type: 'Point',
                coordinates: [outletDoc.longitude, outletDoc.latitude],
              },
              accuracy: outletDoc.accuracy,
              address1: outletDoc.address1,
              address2: outletDoc.address2 ? outletDoc.address2 : '',
              city: outletDoc.city,
              state: outletDoc.state,
              zip: outletDoc.postalCode,
              website: outletDoc.website,
              email: outletDoc.email,
              phone: outletDoc.phone,
            });
            console.log('created-location---->', createdlocation);
            await this.eventModel.updateOne(
              {
                _id: new mongoose.Types.ObjectId(id),
              },
              {
                $addToSet: { locations: createdlocation._id },
              },
            );
          } else {
            const locationData: LocationClass =
              location as unknown as LocationClass;
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
              businessProfile: event.businessProfile,
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

        await this.businessModel.updateOne(
          {
            _id: new mongoose.Types.ObjectId(event.businessProfile),
          },
          {
            $set: { onboardingOfferStatus: OfferStatus.LOCATIONS },
          },
        );
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

    const updatedEvent = await this.eventModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...updateEventDto,
          // eventSchedule: scheduleList,
        },
      },
      { new: true },
    );
    // .populate('images', ImagePopulates.FOREIGN)
    // .populate('locations', LocationPopulates.FOREIGN)
    // // .populate('ageGroupsAllowed', 'name')
    // .populate({
    //   path: 'categories',
    //   select: '_id name image color',
    // });

    const eventLatestDetails = await this.eventModel
      .findById(id)
      .populate('images', ImagePopulates.FOREIGN)
      .populate('locations', LocationPopulates.FOREIGN)
      // .populate('ageGroupsAllowed', 'name')
      .populate({
        path: 'categories',
        select: '_id name image color',
      })
      .populate('user', UserPopulates.FOREIGN)
      .populate('businessProfile', BusinessPopulates.FOREIGN);

    console.log('eventLatestDetails:', eventLatestDetails);
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
        event.creatorType === Business.name &&
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
        event.creatorType === Business.name &&
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
          followingType: Business.name,
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
          followingType: Business.name,
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
    let eventStartsIn = 0;
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    } else {
      const QR_CATEGORY_ID = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      const event = await this.eventModel
        .findById(id)
        .populate('images', ImagePopulates.FOREIGN)
        .populate('locations', LocationPopulates.FOREIGN)
        // .populate('ageGroupsAllowed', 'name')
        .populate({ path: 'categories', select: CategoryPopulates.FOREIGN })
        .populate('eventSchedule')
        .populate('user', UserPopulates.FOREIGN)
        // .populate('businessProfile', BusinessPopulates.FOREIGN)
        .populate({
          path: 'businessProfile',
          populate: {
            path: 'businessIndustry',
            model: BusinessIndustry.name,
          },
          select: BusinessPopulates.FOREIGN,
        })
        .populate({
          path: 'files',
          match: { category: { $ne: QR_CATEGORY_ID._id } },
        });
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      }
      if (event.creatorType === Business.name) {
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
          followingType: Business.name,
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

        if (eventObj.eventSchedule.length) {
          let startDate = null;
          let firstSchedule = eventObj.eventSchedule[0];
          if (firstSchedule.type == ScheduleTypes.FIXED) {
            startDate = firstSchedule.fixedSchedule.date;
          } else if (firstSchedule.type == ScheduleTypes.RECURRING) {
            startDate = firstSchedule.recurringSchedule.startDate;
          }
          const today = new Date();
          const start = new Date(startDate);
          const diffInMs = start.getTime() - today.getTime();
          eventStartsIn = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          console.log('Starttt Date: and Today:', startDate, today);
        }
      }

      return {
        success: true,
        message: 'Event fetched successfully',
        event: eventObj,
        eventStartsIn,
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

  // async publishCrawledEvent(data: PublishCrawledEventDto) {
  //   const { ids, user, businessProfile } = data;
  //   let resData = [];
  //   for (let i = 0; i < ids.length; i++) {
  //     const id = ids[i];
  //     const foundDoc = await this.crawledEventModel.findById(id);
  //     if (!foundDoc) {
  //       return {
  //         success: false,
  //         message: 'No event data found with the id',
  //       };
  //     } else {
  //       let images = [];
  //       //Download image and upload to s3 bucket
  //       if (foundDoc.image) {
  //         const file = await this.downloadImage(foundDoc.image);
  //         const result = await this.s3Service.s3_upload(
  //           file,
  //           process.env.AWS_S3_BUCKET_NAME,
  //           manipulateImageName(foundDoc.title),
  //           'image/jpeg',
  //         );
  //         const createdImage = await this.imageModel.create({
  //           url: result.Location,
  //         });
  //         images.push(createdImage._id);
  //       }
  //       //Save event location
  //       let findQuery = {};
  //       if (mongoose.isValidObjectId(foundDoc.category)) {
  //         findQuery = { _id: new mongoose.Types.ObjectId(foundDoc.category) };
  //       } else {
  //         findQuery = { name: foundDoc.category };
  //       }
  //       const category = await this.categoryModel.findOne(findQuery);
  //       if (!category) {
  //         return {
  //           success: false,
  //           message: 'Category not found',
  //         };
  //       }
  //       const allAgeGroup = await this.ageGroupModel.findOne({
  //         name: 'all',
  //       });
  //       const event = await this.eventModel.create({
  //         isFromCrawler: true,
  //         businessProfile: new mongoose.Types.ObjectId(businessProfile),
  //         user: new mongoose.Types.ObjectId(user),
  //         type: foundDoc.type,
  //         creatorType: Business.name,
  //         status: EventStatus.PUBLISHED,
  //         category,
  //         images,
  //         title: foundDoc.title,
  //         description: foundDoc.description,
  //         schedule: foundDoc.schedule,
  //         // locations: [createdLocation._id],
  //         ageGroupsAllowed: [allAgeGroup._id],
  //         targetGenders: ['male', 'female', 'other'],
  //         promotionCode: '',
  //         // isFree: foundDoc.participationCost == 'Free' ? true : false,
  //         isFree: true,
  //         // participationCost: foundDoc.participationCost.split('')[1],
  //         participationCost: foundDoc.participationCost
  //           ? foundDoc.participationCost
  //           : '',
  //         bookingUrl: foundDoc.website ? foundDoc.website : '',
  //         offset: foundDoc.offset,
  //       });
  //       if (foundDoc.coordinates) {
  //         const locationObj = {
  //           type: 'Point',
  //           coordinates: [
  //             foundDoc.coordinates['lng'],
  //             foundDoc.coordinates['lat'],
  //           ],
  //         };
  //         // Add the location to business location as well
  //         const businessLocationId = await this.businessLocationModel.create({
  //           latitude: foundDoc.coordinates['lat'],
  //           longitude: foundDoc.coordinates['lng'],
  //           accuracy: 0,
  //           address1: foundDoc.address,
  //           address2: '',
  //           city: '',
  //           state: '',
  //           zip: '',
  //           website: foundDoc.website ? foundDoc.website : '',
  //           email: foundDoc.email ? foundDoc.email : '',
  //           phone: foundDoc.phone ? foundDoc.phone : '',
  //           businessProfile: new mongoose.Types.ObjectId(businessProfile),
  //         });
  //         const createdLocation = await this.eventLocationModel.create({
  //           location: locationObj,
  //           accuracy: 0,
  //           event: event._id,
  //           address1: foundDoc.address,
  //           address2: '',
  //           city: '',
  //           state: '',
  //           zip: '',
  //           website: foundDoc.website ? foundDoc.website : '',
  //           email: foundDoc.email ? foundDoc.email : '',
  //           phone: foundDoc.phone ? foundDoc.phone : '',
  //           businessLocationId: businessLocationId._id,
  //         });
  //         const updatedEvent = await this.eventModel.findByIdAndUpdate(
  //           event.id,
  //           {
  //             $addToSet: {
  //               locations: createdLocation._id,
  //             },
  //           },
  //           { new: true },
  //         );
  //         resData.push(updatedEvent);

  //         //Update the crawled event status
  //         await this.crawledEventModel.findByIdAndUpdate(id, {
  //           status: CrawledEventStatus.PUBLISHED,
  //         });
  //       } else {
  //         resData.push(event);
  //       }
  //     }
  //   }
  //   return {
  //     success: true,
  //     message: 'Event has been published successfully.',
  //     data: resData,
  //   };
  // }

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
        event.creatorType === Business.name &&
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
      const event = await this.eventModel.findById(id).populate('files');
      const business = await this.businessModel.findById(user.businessProfile);
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
        };
      } else if (
        event.creatorType === BusinessUser.name &&
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
          await this.businessModel.updateOne(
            { _id: business._id },
            {
              $set: {
                onboardingOfferStatus: OfferStatus.PUBLISHED,
                continueJourney: false,
              },
            },
          );
          if (event.notifyFollowers) {
            const business = await this.businessModel.findById(
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
              case EventTypes.FORMAL:
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
              console.log("Followers:", followers);
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
                  user: followers[i].follower['_id'],
                  userType: User.name,
                  message,
                  type: NotificationTypes.EVENT,
                  event: new mongoose.Types.ObjectId(id),
                  targetType: User.name,
                  targetUser: new mongoose.Types.ObjectId(user.businessProfile),
                });
              }
            }
          }
          if (data.saveAsTemplate) {
            let createQuery = { ...event.toObject() };
            delete createQuery._id;
            delete createQuery.__v;
            if (event.creatorType === BusinessUser.name) {
              createQuery['businessProfile'] = new mongoose.Types.ObjectId(
                user.businessProfile,
              );
            } else {
              createQuery['user'] = new mongoose.Types.ObjectId(user.id);
            }
            console.log('event:', event);
            let thumbnailURL = (event as any).files?.[0]?.metaData?.url || null;
            console.log('thumbnailURL:', thumbnailURL);

            const createdTemplate = await this.templateModel.create({
              ...createQuery,
              user: new mongoose.Types.ObjectId(user.id),
              creatorType: BusinessUser.name,
              businessIndustry: business.businessIndustry,
              businessCategories: business.businessCategories,
              // creatorType: user.isBusiness ? BusinessUser.name : User.name,
              thumbnail: thumbnailURL,
              businessProfile: new mongoose.Types.ObjectId(
                user.businessProfile,
              ),
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

  async createInvitation(data: InviteEventDto, user: DecodedUser) {
    const event = await this.eventModel.findById(data.event);
    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }
    if (event.creatorType === Business.name) {
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
        message: 'Event invitations created successfully.',
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
    if (event.creatorType === Business.name) {
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
      if (template.creatorType === Business.name) {
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
      if (template.creatorType === Business.name) {
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
          await this.eventModel.updateOne(
            { _id: new mongoose.Types.ObjectId(eventId) },
            { $inc: { engagementCount: 1 } },
          );
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

  async getSavedEventsOld(
    userId: string,
    type: string,
    latitude: number,
    longitude: number,
    page: number,
    limit: number,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    } else {
      let searchQuery = {};
      if (type == 'all') {
        searchQuery = {
          'schedule.date': { $gte: new Date() },
        };
      } else {
        searchQuery = {
          type: type,
          'schedule.date': { $gte: new Date() },
        };
      }
      // {
      //   type: EventTypes.PRIVATE,
      //   user: new mongoose.Types.ObjectId(userId),
      // }
      const events = await this.eventModel
        .find({
          $or: [
            {
              type: EventTypes.PRIVATE,
              user: new mongoose.Types.ObjectId(userId),
              // 'schedule.date': { $gte: new Date() },
            },
            {
              _id: {
                $in: user.savedEvents,
                // 'schedule.date': { $gte: new Date() },
              },
            },
          ],
        })
        .populate('user', UserPopulates.FOREIGN)
        .populate('businessProfile', BusinessPopulates.FOREIGN)
        .populate('files')
        .populate('locations')
        .populate('eventSchedule')
        // .populate('ageGroupsAllowed', 'name')
        .populate('categories', CategoryPopulates.FOREIGN)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
      let eventsData = [];
      let offersData = [];
      let privateEvents = [];
      for (let i = 0; i < events.length; i++) {
        const event = JSON.parse(JSON.stringify(events[i]));
        event['distance'] = event.locations.length
          ? haversineDistance(
              latitude,
              longitude,
              event.locations[0].location.coordinates[1],
              event.locations[0].location.coordinates[0],
            )
          : 0;
        const isSaved = await this.userService.isEventSaved(
          events[i].id,
          user.id,
        );
        const isLiked = await this.userService.isEventLiked(
          events[i].id,
          user.id,
        );
        if (events[i].creatorType === 'User') {
          const creator = await this.userModel.findById(
            events[i].user['_id'].toString(),
          );
          const isFollowedByMe = await this.followModel.findOne({
            followerType: User.name,
            follower: new mongoose.Types.ObjectId(user.id),
            followingType: User.name,
            following: creator._id,
            isBlocked: false,
          });
          event['creatorDetails'] = {
            _id: creator._id,
            name: creator.name,
            profilePhoto: creator.profilePhoto,
            email: creator.email,
            bio: '',
            phone: creator.phone,
            website: '',
            followersCount: creator.followersCount,
            profileType: 'User',
            following: isFollowedByMe ? true : false,
            isMe: creator.id == user.id,
          };
        } else {
          const businessProfile = await this.businessModel.findById(
            events[i].businessProfile._id.toString(),
          );
          const isFollowedByMe = await this.followModel.findOne({
            followerType: User.name,
            follower: new mongoose.Types.ObjectId(user.id),
            followingType: 'Business',
            following: businessProfile._id,
            isBlocked: false,
          });
          event['creatorDetails'] = {
            _id: businessProfile._id,
            name: businessProfile.name,
            profilePhoto: businessProfile.logo,
            email: businessProfile.email,
            phone: businessProfile.phone,
            website: businessProfile.website,
            bio: businessProfile.bio,
            followersCount: businessProfile.followersCount,
            profileType: 'BusinessProfile',
            following: isFollowedByMe ? true : false,
            isMe: businessProfile.id == user.id,
          };
          event['images'] = events[i]['files'];
          delete event['files'];
        }
        if (events[i].type == EventTypes.FORMAL) {
          eventsData.push({ ...event, isSaved, isLiked });
        } else if (events[i].type == EventTypes.OFFER) {
          offersData.push({ ...event, isSaved, isLiked });
        } else if (events[i].type == EventTypes.PRIVATE) {
          privateEvents.push({ ...event, isSaved, isLiked });
        }
      }
      const liked = await this.getLikedEvents(
        userId,
        type,
        latitude,
        longitude,
        page,
        limit,
      );
      const aggregationPipeline: any = [
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
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

        // Populate event.user
        {
          $lookup: {
            from: 'users',
            let: { userId: '$event.user' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$userId'] },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  phone: 1,
                  profilePhoto: 1,
                  followersCount: 1,
                  followingCount: 1,
                },
              },
            ],
            as: 'event.user',
          },
        },
        { $unwind: { path: '$event.user', preserveNullAndEmptyArrays: true } },

        // Populate event.businessProfile
        {
          $lookup: {
            from: 'businesses',
            let: { businessProfileId: '$event.businessProfile' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$businessProfileId'] },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  bio: 1,
                  brandColor: 1,
                  profilePhoto: 1,
                  logo: 1,
                  followersCount: 1,
                  countryCode: 1,
                  phone: 1,
                  email: 1,
                  website: 1,
                  isDeleted: 1,
                  instagramPageUrl: 1,
                  twitterPageUrl: 1,
                  facebookPageUrl: 1,
                },
              },
            ],
            as: 'event.businessProfile',
          },
        },
        {
          $unwind: {
            path: '$event.businessProfile',
            preserveNullAndEmptyArrays: true,
          },
        },

        // Populate locations
        {
          $lookup: {
            from: 'eventlocations',
            localField: 'event._id',
            foreignField: 'event',
            as: 'event.locations',
          },
        },

        // Populate schedule
        {
          $lookup: {
            from: 'eventschedules',
            localField: 'event.eventSchedule',
            foreignField: '_id',
            as: 'event.eventSchedule',
          },
        },

        // Populate categories
        {
          $lookup: {
            from: 'categories',
            localField: 'event.categories',
            foreignField: '_id',
            as: 'event.categories',
          },
        },

        // Populate files (images)
        {
          $lookup: {
            from: 'files',
            localField: 'event.drivePath',
            foreignField: 'parentDirectory',
            as: 'event.images',
          },
        },

        {
          $replaceWith: '$event',
        },

        { $sort: { createdAt: -1 } },

        { $skip: (page - 1) * limit },
        { $limit: limit },

        // Final shape adjustment (optional $project or transformation)
      ];

      const reportedEvents =
        await this.reportModel.aggregate(aggregationPipeline);

      return {
        success: true,
        message: 'Saved events fetched successfully',
        data: {
          events: eventsData,
          offers: offersData,
          privateEvents: privateEvents,
          liked: liked.events,
          reported: reportedEvents,
        },
      };
    }
  }

  async getSavedEvents(
    userId: string,
    type: string,
    latitude: number,
    longitude: number,
    page: number,
    limit: number,
  ) {
    let startDate = new Date();
    let endDate = new Date(
      new Date(startDate).setFullYear(startDate.getFullYear() + 2),
    );
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    } else {
      let savedEventsObjectIds = user.savedEvents.map(
        (event) => new mongoose.Types.ObjectId(event),
      );
      const searchQuery: any = {
        $or: [
          {
            'event.type': EventTypes.PRIVATE,
            'event.participants': new mongoose.Types.ObjectId(userId),
          },
          {
            'event._id': {
              $in: savedEventsObjectIds,
            },
          },
        ],
        // 'event.schedule.date': { $gte: getZeroDateTz(new Date()) },
        // 'event.schedule.durations.endTime': { $gte: currentDateTz() },
      };
      if (type !== 'all') {
        searchQuery.type = type;
      }
      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
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
            as: 'categories',
          },
        },
        {
          $lookup: {
            from: 'files', // assuming this is the same collection as QR_CODE
            let: { folderId: '$event.drivePath' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parentDirectory', '$$folderId'] },
                      {
                        $ne: [
                          '$category',
                          new mongoose.Types.ObjectId(QR_ImageCategory.id),
                        ],
                      },
                    ],
                  },
                },
              },
            ],
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
        // {
        //   $lookup: {
        //     from: 'users',
        //     localField: 'event.user',
        //     foreignField: '_id',
        //     as: 'userDetails',
        //   },
        // },
        // { $unwind: '$userDetails' },
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
          $group: {
            _id: '$event._id',
            locationId: { $first: '$_id' },
            distance: { $first: { $divide: ['$distance', 1609.34] } },
            title: { $first: '$event.title' },
            creatorType: { $first: '$event.creatorType' },
            keywords: { $first: '$event.keywords' },
            description: { $first: '$event.description' },
            schedule: { $first: '$event.eventSchedule' },
            // locations: { $first: '$event.locations' },
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
            files: { $first: '$images' },
            ageGroupsAllowed: { $first: '$ageGroupsAllowed' },
            isSaved: { $first: '$isSaved' },
            isLiked: { $first: '$isLiked' },
            locations: {
              $push: {
                location: '$location',
                accuracy: '$accuracy',
                address1: '$address1',
                address2: '$address2',
                city: '$city',
                state: '$state',
                zip: '$zip',
                website: '$website',
                _id: '$_id',
                email: '$email',
                phone: '$phone',
                distance: { $divide: ['$distance', 1609.34] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'eventschedules',
            localField: 'schedule',
            foreignField: '_id',
            as: 'schedules',
          },
        },
        {
          $addFields: {
            schedules: {
              $filter: {
                input: '$schedules',
                as: 'schedule',
                cond: {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$$schedule.type', 'fixed'] },
                        {
                          $and: [
                            {
                              $gte: [
                                '$$schedule.fixedSchedule.date',
                                startDate,
                              ],
                            },
                            {
                              $lte: ['$$schedule.fixedSchedule.date', endDate],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ['$$schedule.type', 'recurring'] },
                        {
                          $and: [
                            {
                              $gte: [
                                '$$schedule.recurringSchedule.endDate',
                                startDate,
                              ],
                            },
                            {
                              $lte: [
                                '$$schedule.recurringSchedule.endDate',
                                endDate,
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $match: {
            $expr: { $gt: [{ $size: '$schedules' }, 0] },
          },
        },
        {
          $project: {
            _id: 1,
            distance: 1,
            title: 1,
            keywords: 1,
            description: 1,
            type: 1,
            status: 1,
            notifyFollowers: 1,
            targetGenders: 1,
            promotionCode: 1,
            isFree: 1,
            participationCost: 1,
            bookingUrl: 1,
            termsAndConditions: 1,
            ageGroupsAllowed: {
              minAge: '$minTargetAge',
              maxAge: '$maxTargetAge',
            },
            categories: {
              $map: {
                input: '$categories',
                as: 'category',
                in: {
                  _id: '$$category._id',
                  name: '$$category.title',
                  darkIcon: '$$category.darkIcon',
                  lightIcon: '$$category.lightIcon',
                  activeColor: '$$category.activeColor',
                },
              },
            },
            businessProfileDetails: {
              _id: '$businessProfileDetails._id',
              name: '$businessProfileDetails.name',
              cover: '$businessProfileDetails.cover',
              logo: '$businessProfileDetails.logo',
              email: '$businessProfileDetails.email',
              bio: '$businessProfileDetails.bio',
              description: '$businessProfileDetails.description',
              followersCount: '$businessProfileDetails.followersCount',
              isFollowedByMe: '$isFollowedByMe',
              profileType: 'BusinessProfile',
              phone: '$businessProfileDetails.phone',
              website: '$businessProfileDetails.website',
              facebookPageUrl: '$businessProfileDetails.facebookPageUrl',
              instagramPageUrl: '$businessProfileDetails.instagramPageUrl',
              twitterPageUrl: '$businessProfileDetails.XPageUrl',
            },
            // QR_CODE: {
            //   _id: '$QR_CODE._id',
            //   url: '$QR_CODE.metaData.url',
            // },
            creatorDetails: {
              $cond: {
                if: { $eq: ['$creatorType', 'User'] },
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
                  isDeleted: '$userDetails.isDeleted',
                  isMe: false,
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
                  description: '$businessProfileDetails.description',
                  logo: '$businessProfileDetails.logo',
                  cover: '$businessProfileDetails.cover',
                  isDeleted: '$businessProfileDetails.isDeleted',
                  facebookPageUrl: '$businessProfileDetails.facebookPageUrl',
                  instagramPageUrl: '$businessProfileDetails.instagramPageUrl',
                  twitterPageUrl: '$businessProfileDetails.XPageUrl',
                  isMe: false,
                },
              },
            },
            images: {
              $map: {
                input: '$files',
                as: 'file',
                in: {
                  _id: '$$file._id',
                  url: '$$file.metaData.url',
                },
              },
            },
            creatorType: 1,
            locations: 1,
            schedules: 1,
          },
        },
        { $sort: { createdAt: -1, _id: 1 } },
        {
          $facet: {
            data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
            totalCount: [{ $count: 'count' }],
          },
        },
      ]);
      console.log('result', result);

      const total = result[0].totalCount[0]?.count || 0;
      const eventsData = result[0].data;
      const liked = await this.getLikedEvents(
        userId,
        type,
        latitude,
        longitude,
        page,
        limit,
      );
      const reportedEvents = await this.getReports(userId, page, limit);

      return {
        success: true,
        message: 'Saved events fetched successfully',
        data: {
          events: eventsData,
          liked: liked.events,
          reported: reportedEvents.reports,
        },
        // data: result[0].data,
        // total: total,
        // pages: Math.ceil(total / limit),
        // page: page,
        // limit: limit,
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
        event.creatorType === Business.name &&
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
        event.creatorType === BusinessUser.name &&
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
        for (let i = 0; i < event.eventSchedule.length; i++) {
          const schedule = await this.scheduleModel.findOne({
            _id: event.eventSchedule[i],
          });
          if (schedule.type === ScheduleTypes.FIXED) {
            if (schedule.fixedSchedule.date >= getZeroDateTz(new Date())) {
              let durations = [];
              for (
                let j = 0;
                j < schedule.fixedSchedule.durations.length;
                j++
              ) {
                const duration = schedule.fixedSchedule.durations[j];
                if (new Date(duration.endTime) > currentDateTz()) {
                  durations.push(duration);
                }
              }
              if (durations.length) {
                schedules.push({ ...schedule, durations });
              }
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
                businessProfile: event.businessProfile,
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
        // let images = [];
        // if (event.images.length) {
        //   for (let i = 0; i < event.images.length; i++) {
        //     const image = await this.imageModel
        //       .findById(event.images[i])
        //       .lean();
        //     if (image) {
        //       const imageObj = { ...image };
        //       delete imageObj['_id'];
        //       delete imageObj['createdAt'];
        //       delete imageObj['updatedAt'];
        //       const copiedImage = await this.imageModel.create({
        //         ...imageObj,
        //         event: copiedEvent._id,
        //       });
        //       images.push(copiedImage._id);
        //     }
        //   }
        // }
        // if (images.length) {
        //   await this.eventModel.findByIdAndUpdate(copiedEvent._id, {
        //     $push: { images: { $each: images } },
        //   });
        // }
        const updatedEvent = await this.eventModel
          .findById(copiedEvent._id)
          // .populate('images', ImagePopulates.FOREIGN)
          .populate('locations', LocationPopulates.FOREIGN);
        // .populate('ageGroupsAllowed', '_id id name');
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
          //Increase the engagement count of the event
          await this.eventModel.updateOne(
            { _id: new mongoose.Types.ObjectId(eventId) },
            { $inc: { engagementCount: 1 } },
          );

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
            let message = `${user.name} liked your event ${event.title}`;
            await this.notificationModel.create({
              user: event.businessProfile,
              userType: Business.name,
              message,
              type: NotificationTypes.LIKE,
              targetType: Business.name,
              targetUser: new mongoose.Types.ObjectId(userId),
              isRead: false,
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
    page: number,
    limit: number,
  ) {
    let startDate = new Date();
    let endDate = new Date(
      new Date(startDate).setFullYear(startDate.getFullYear() + 2),
    );
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    } else {
      let searchQuery = {
        'event._id': { $in: user.likedEvents },
        // 'event.schedule.date': { $gte: getZeroDateTz(new Date()) },
        // 'event.schedule.durations.endTime': { $gte: currentDateTz() },
      };
      if (type !== 'all') {
        searchQuery['event.type'] = type;
      }
      console.log('searchQuery', searchQuery, latitude, longitude);
      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
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
            as: 'categories',
          },
        },
        // {
        //   $lookup: {
        //     from: 'images',
        //     localField: 'event.images',
        //     foreignField: '_id',
        //     as: 'images',
        //   },
        // },
        {
          $lookup: {
            from: 'files', // assuming this is the same collection as QR_CODE
            let: { folderId: '$event.drivePath' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parentDirectory', '$$folderId'] },
                      {
                        $ne: [
                          '$category',
                          new mongoose.Types.ObjectId(QR_ImageCategory.id),
                        ],
                      },
                    ],
                  },
                },
              },
            ],
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
        // {
        //   $lookup: {
        //     from: 'users',
        //     localField: 'event.user',
        //     foreignField: '_id',
        //     as: 'userDetails',
        //   },
        // },
        // { $unwind: '$userDetails' },
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
        //     foreignField: 'likedEvents',
        //     as: 'likedEvents',
        //   },
        // },
        // {
        //   $addFields: {
        //     // isSaved: {
        //     //   $in: [userId, '$savedEvents._id'],
        //     // },
        //     isSaved: true,
        //     isLiked: {
        //       $in: [userId, '$likedEvents._id'],
        //     },
        //     'event.isFollowedByMe': {
        //       $cond: {
        //         if: { $eq: ['$event.creatorType', 'User'] },
        //         then: {
        //           $cond: {
        //             if: {
        //               $ne: [
        //                 null,
        //                 {
        //                   $first: {
        //                     $filter: {
        //                       input: '$event.follows',
        //                       as: 'follow',
        //                       cond: {
        //                         $and: [
        //                           { $eq: ['$$follow.follower', userId] },
        //                           { $eq: ['$$follow.followerType', 'User'] },
        //                           {
        //                             $eq: [
        //                               '$$follow.following',
        //                               '$userDetails._id',
        //                             ],
        //                           },
        //                           { $eq: ['$$follow.followingType', 'User'] },
        //                           { $eq: ['$$follow.isBlocked', false] },
        //                         ],
        //                       },
        //                     },
        //                   },
        //                 },
        //               ],
        //             },
        //             then: true,
        //             else: false,
        //           },
        //         },
        //         else: {
        //           $cond: {
        //             if: {
        //               $ne: [
        //                 null,
        //                 {
        //                   $first: {
        //                     $filter: {
        //                       input: '$event.follows',
        //                       as: 'follow',
        //                       cond: {
        //                         $and: [
        //                           { $eq: ['$$follow.follower', userId] },
        //                           { $eq: ['$$follow.followerType', 'User'] },
        //                           {
        //                             $eq: [
        //                               '$$follow.following',
        //                               '$businessProfileDetails._id',
        //                             ],
        //                           },
        //                           {
        //                             $eq: [
        //                               '$$follow.followingType',
        //                               'BusinessProfile',
        //                             ],
        //                           },
        //                           { $eq: ['$$follow.isBlocked', false] },
        //                         ],
        //                       },
        //                     },
        //                   },
        //                 },
        //               ],
        //             },
        //             then: true,
        //             else: false,
        //           },
        //         },
        //       },
        //     },
        //   },
        // },
        // {
        //   $project: {
        //     _id: 1,
        //     distance: { $divide: ['$distance', 1000] },
        //     'event._id': 1,
        //     'event.title': 1,
        //     'event.creatorType': 1,
        //     'event.keywords': 1,
        //     'event.description': 1,
        //     'event.schedule': 1,
        //     'event.locations': {
        //       $map: {
        //         input: '$locations',
        //         as: 'location',
        //         in: {
        //           _id: '$$location._id',
        //           location: '$$location.location',
        //           businessLocationId: '$$location.businessLocationId',
        //           accuracy: '$$location.accuracy',
        //           address1: '$$location.address1',
        //           address2: '$$location.address2',
        //           city: '$$location.city',
        //           state: '$$location.state',
        //           zip: '$$location.zip',
        //           website: '$$location.website',
        //           email: '$$location.email',
        //           phone: '$$location.phone',
        //         },
        //       },
        //     },
        //     'event.type': 1,
        //     'event.status': 1,
        //     'event.targetGenders': 1,
        //     'event.promotionCode': 1,
        //     'event.isFree': 1,
        //     'event.participationCost': 1,
        //     'event.bookingUrl': 1,
        //     'event.notifyFollowers': 1,
        //     'event.RSVP': 1,
        //     'event.termsApplied': 1,
        //     'event.termsAndConditions': 1,
        //     'event.facebookPostId': 1,
        //     'event.specifyForEachDay': 1,
        //     'event.participants': 1,
        //     'event.creatorDetails': {
        //       $cond: {
        //         if: { $eq: ['$event.creatorType', 'User'] },
        //         then: {
        //           _id: '$userDetails._id',
        //           name: '$userDetails.name',
        //           profilePhoto: '$userDetails.profilePhoto',
        //           email: '$userDetails.email',
        //           bio: '$userDetails.bio',
        //           followersCount: '$userDetails.followersCount',
        //           profileType: 'User',
        //           phone: '$userDetails.phone',
        //           website: '',
        //           isFollowedByMe: '$event.isFollowedByMe',
        //         },
        //         else: {
        //           _id: '$businessProfileDetails._id',
        //           name: '$businessProfileDetails.name',
        //           profilePhoto: '$businessProfileDetails.profilePhoto',
        //           email: '$businessProfileDetails.email',
        //           bio: '$businessProfileDetails.bio',
        //           followersCount: '$businessProfileDetails.followersCount',
        //           profileType: 'BusinessProfile',
        //           phone: '$businessProfileDetails.phone',
        //           website: '$businessProfileDetails.website',
        //           isFollowedByMe: '$event.isFollowedByMe',
        //         },
        //       },
        //     },
        //     'category._id': 1,
        //     'category.name': 1,
        //     'category.image': 1,
        //     images: { _id: 1, url: 1 },
        //     ageGroupsAllowed: { _id: 1, name: 1 },
        //     isSaved: 1,
        //     isLiked: 1,
        //   },
        // },
        {
          $group: {
            _id: '$event._id',
            locationId: { $first: '$_id' },
            distance: { $min: '$distance' },
            title: { $first: '$event.title' },
            creatorType: { $first: '$event.creatorType' },
            keywords: { $first: '$event.keywords' },
            description: { $first: '$event.description' },
            schedule: { $first: '$event.eventSchedule' },
            // locations: { $first: '$event.locations' },
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
            locations: {
              $push: {
                location: '$location',
                accuracy: '$accuracy',
                address1: '$address1',
                address2: '$address2',
                city: '$city',
                state: '$state',
                zip: '$zip',
                website: '$website',
                _id: '$_id',
                email: '$email',
                phone: '$phone',
                distance: { $divide: ['$distance', 1609.34] },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            locationId: 1,
            distance: { $divide: ['$distance', 1609.34] },
            title: 1,
            creatorType: 1,
            keywords: 1,
            description: 1,
            schedule: 1,
            type: 1,
            status: 1,
            targetGenders: 1,
            promotionCode: 1,
            isFree: 1,
            participationCost: 1,
            bookingUrl: 1,
            notifyFollowers: 1,
            RSVP: 1,
            termsApplied: 1,
            termsAndConditions: 1,
            facebookPostId: 1,
            specifyForEachDay: 1,
            participants: 1,
            creatorDetails: 1,
            category: 1,
            images: 1,
            ageGroupsAllowed: 1,
            isSaved: 1,
            isLiked: 1,
            locations: 1,
          },
        },
        {
          $lookup: {
            from: 'eventschedules',
            localField: 'schedule',
            foreignField: '_id',
            as: 'schedules',
          },
        },
        {
          $addFields: {
            schedules: {
              $filter: {
                input: '$schedules',
                as: 'schedule',
                cond: {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$$schedule.type', 'fixed'] },
                        {
                          $and: [
                            {
                              $gte: [
                                '$$schedule.fixedSchedule.date',
                                startDate,
                              ],
                            },
                            {
                              $lte: ['$$schedule.fixedSchedule.date', endDate],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ['$$schedule.type', 'recurring'] },
                        {
                          $and: [
                            {
                              $gte: [
                                '$$schedule.recurringSchedule.endDate',
                                startDate,
                              ],
                            },
                            {
                              $lte: [
                                '$$schedule.recurringSchedule.endDate',
                                endDate,
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $match: {
            $expr: { $gt: [{ $size: '$schedules' }, 0] },
          },
        },
        // {
        //   $addFields: {
        //     schedule: {
        //       $filter: {
        //         input: '$schedule',
        //         as: 'sched',
        //         cond: {
        //           $or: [
        //             { $gte: ['$$sched.date', currentDateTz()] }, // Include today or future
        //             { $eq: ['$$sched.date', currentDateTz()] }, // Specifically today
        //           ],
        //           // $or: [
        //           //   { $gte: ['$$sched.date', start] },
        //           // {
        //           // $and: [
        //           //   { $gte: ['$$sched.date', currentDateTz()] },
        //           //   {
        //           //     $anyElementTrue: {
        //           //       $map: {
        //           //         input: '$$sched.durations',
        //           //         as: 'duration',
        //           //         in: { $gte: ['$$duration.endTime', currentDateTz()] },
        //           //       },
        //           //     },
        //           //   },
        //           // ],
        //           // },
        //           // ],
        //         },
        //       },
        //     },
        //     distance: {
        //       $round: ['$distance', 2],
        //     },
        //   },
        // },
        {
          $sort: {
            distance: 1,
            createdAt: -1,
            _id: 1,
          },
        },
        {
          $facet: {
            data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
            totalCount: [{ $count: 'count' }],
          },
        },
      ]);
      let total = events[0]?.totalCount[0]?.count || 0;
      return {
        success: true,
        message: 'Liked events fetched successfully',
        events: events[0]?.data || [],
        total: total,
        pages: Math.ceil(total / limit),
        page: page,
        limit: limit,
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
        event.creatorType === Business.name &&
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
  async getReportTypes() {
    const reportTypes = Object.values(ReportTypes);
    return {
      success: true,
      message: 'Report types fetched successfully',
      data: reportTypes,
    };
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
    const isAlreadyReported = await this.reportModel.findOne({
      user: new mongoose.Types.ObjectId(userId),
      event: new mongoose.Types.ObjectId(data.event),
    });
    if (isAlreadyReported) {
      return {
        success: true,
        message: 'Event reported successfully.',
      };
    }
    let message = `${user.name} reported your event ${event.title}`;

    await this.notificationModel.create({
      user: event.businessProfile,
      userType: Business.name,
      message,
      type: NotificationTypes.REPORT,
      targetType: Business.name,
      event: event._id,
      targetUser: new mongoose.Types.ObjectId(userId),
    });

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

  async getReports(userId: string, page: number, limit: number) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    const aggregationPipeline: any = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
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

      // Populate event.user
      {
        $lookup: {
          from: 'users',
          let: { userId: '$event.user' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                profilePhoto: 1,
                followersCount: 1,
                followingCount: 1,
              },
            },
          ],
          as: 'event.user',
        },
      },
      { $unwind: { path: '$event.user', preserveNullAndEmptyArrays: true } },

      // Populate event.businessProfile
      {
        $lookup: {
          from: 'businesses',
          let: { businessProfileId: '$event.businessProfile' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$businessProfileId'] },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                bio: 1,
                brandColor: 1,
                profilePhoto: 1,
                logo: 1,
                followersCount: 1,
                countryCode: 1,
                phone: 1,
                email: 1,
                website: 1,
                isDeleted: 1,
                instagramPageUrl: 1,
                twitterPageUrl: 1,
                facebookPageUrl: 1,
              },
            },
          ],
          as: 'event.businessProfile',
        },
      },
      {
        $unwind: {
          path: '$event.businessProfile',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Populate locations
      {
        $lookup: {
          from: 'eventlocations',
          localField: 'event._id',
          foreignField: 'event',
          as: 'event.locations',
        },
      },

      // Populate schedule
      {
        $lookup: {
          from: 'eventschedules',
          localField: 'event.eventSchedule',
          foreignField: '_id',
          as: 'event.eventSchedule',
        },
      },

      // Populate categories
      {
        $lookup: {
          from: 'categories',
          localField: 'event.categories',
          foreignField: '_id',
          as: 'event.categories',
        },
      },

      // Populate files (images)
      {
        $lookup: {
          from: 'files',
          localField: 'event.drivePath',
          foreignField: 'parentDirectory',
          as: 'event.images',
        },
      },

      {
        $replaceWith: '$event',
      },

      { $sort: { createdAt: -1 } },

      { $skip: (page - 1) * limit },
      { $limit: limit },

      // Final shape adjustment (optional $project or transformation)
    ];

    const reports = await this.reportModel.aggregate(aggregationPipeline);

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
              if (
                new Date(data.fixedSchedule[i].date.toString()).setHours(
                  0,
                  0,
                  0,
                  0,
                ) < new Date().setHours(0, 0, 0, 0)
              ) {
                return {
                  success: false,
                  message: `Date cannot be in past for the date ${data.fixedSchedule[i].date}`,
                };
              }

              for (let j = 0; j < data.fixedSchedule[i].durations.length; j++) {
                const duration = data.fixedSchedule[i].durations[j];

                if (duration) {
                  const baseDate = new Date(data.fixedSchedule[i].date); // base date
                  const originalStart = new Date(duration['startTime']);
                  const originalEnd = new Date(duration['endTime']);

                  const newStart = new Date(
                    Date.UTC(
                      baseDate.getUTCFullYear(),
                      baseDate.getUTCMonth(),
                      baseDate.getUTCDate(),
                      originalStart.getUTCHours(),
                      originalStart.getUTCMinutes(),
                      0,
                      0,
                    ),
                  );

                  const newEnd = new Date(
                    Date.UTC(
                      baseDate.getUTCFullYear(),
                      baseDate.getUTCMonth(),
                      baseDate.getUTCDate(),
                      originalEnd.getUTCHours(),
                      originalEnd.getUTCMinutes(),
                      0,
                      0,
                    ),
                  );

                  data.fixedSchedule[i].durations[j]['startTime'] = newStart;
                  data.fixedSchedule[i].durations[j]['endTime'] = newEnd;
                }
              }

              data.fixedSchedule[i].durations.sort((a, b) => {
                return a['startTime'] - b['startTime'];
              });
            }
            data.fixedSchedule.sort((a, b) => {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
          }

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
                businessId: new mongoose.Types.ObjectId(user.businessProfile),
              };
              if (data.date_range) {
                scheduleObj['date_range'] = data.date_range;
              }
              if (data.each_date) {
                scheduleObj['each_date'] = data.each_date;
              }
              const createdSchedule =
                await this.scheduleModel.create(scheduleObj);
              scheduleList.push(createdSchedule._id);
            }
          }
        } else if (
          data.scheduleType == ScheduleTypes.RECURRING &&
          data.recurringSchedule
        ) {
          // let startDate = new Date(data.recurringSchedule.startDate);
          // let endDate = new Date(data.recurringSchedule.endDate);
          // if (startDate < new Date(Date.now())) {
          //   return {
          //     success: false,
          //     message: `Start date cannot be in past`,
          //   };
          // }
          // if (endDate < new Date(Date.now())) {
          //   return {
          //     success: false,
          //     message: `End date cannot be in past`,
          //   };
          // }
          // data.recurringSchedule.startDate = startDate;
          // data.recurringSchedule.endDate = endDate;
          // console.log('Check:2', startDate, endDate);
          // if (startDate > endDate) {
          //   return {
          //     success: false,
          //     message: `Start date cannot be greater than end date for this schedule`,
          //   };
          // }
          // let week = data.recurringSchedule.weekDays;
          // for (let i = 0; i < Object.keys(week).length; i++) {
          //   let day = Object.keys(week)[i];
          //   let dayObj = week[day];
          //   console.log('day:', day);
          //   console.log('Day Data:', dayObj);
          //   if (dayObj.included) {
          //     if (dayObj.durations.length == 0) {
          //       return {
          //         success: false,
          //         message: `Please provide the duration for the ${day}`,
          //       };
          //     }
          //     //durations array
          //     for (let j = 0; j < dayObj.durations.length; j++) {
          //       console.log('Duration:', dayObj.durations[j]);
          //       let duration = dayObj.durations[j];
          //       // let startTime = duration.startTime;
          //       // let endTime = duration.endTime;
          //       let startHour = duration.startHour;
          //       let startMinute = duration.startMinute;
          //       let endHour = duration.endHour;
          //       let endMinute = duration.endMinute;
          //       const isValid = this.isValidTimeRange(
          //         startHour,
          //         startMinute,
          //         endHour,
          //         endMinute,
          //       );
          //       if (!isValid) {
          //         return {
          //           success: false,
          //           message: `Start time cannot be greater than end time for the day ${Object.keys(day)} and duration at index ${j}`,
          //         };
          //       }
          //     }
          //     dayObj.durations.sort((a, b) => {
          //       return (
          //         a.startHour * 60 +
          //         a.startMinute -
          //         (b.startHour * 60 + b.startMinute)
          //       );
          //     });
          //     data.recurringSchedule.weekDays[day] = dayObj;
          //   }
          // }
          // let scheduleObj = {
          //   type: data.scheduleType,
          //   event: new mongoose.Types.ObjectId(eventId),
          //   recurringSchedule: {
          //     startDate: data.recurringSchedule.startDate,
          //     endDate: data.recurringSchedule.endDate,
          //     weekDays: data.recurringSchedule.weekDays,
          //   },
          //   businessId: new mongoose.Types.ObjectId(user.businessProfile),
          // };
          // const createdSchedule = await this.scheduleModel.create(scheduleObj);
          // scheduleList.push(createdSchedule._id);
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
        await this.businessModel.updateOne(
          {
            _id: new mongoose.Types.ObjectId(event.businessProfile),
          },
          {
            $set: { onboardingOfferStatus: OfferStatus.SCHEDULE },
          },
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

  async editSchedule(
    scheduleId: string,
    eventId: string,
    userId: string,
    data: CreateScheduleDto,
  ) {
    if (!mongoose.isValidObjectId(scheduleId)) {
      return {
        success: false,
        message: 'Please provide a valid schedule id',
      };
    }
    const schedule = await this.scheduleModel.findById(scheduleId);
    if (!schedule) {
      return {
        success: false,
        message: 'Schedule not found',
      };
    }
    if (schedule.event.toString() !== eventId) {
      return {
        success: false,
        message: 'This schedule does not belong to this event',
      };
    }
    return {
      success: true,
      message: 'Schedule fetched successfully',
      data: schedule,
    };
  }
  async deleteSchedule(scheduleId: string, eventId: string) {
    if (!mongoose.isValidObjectId(scheduleId)) {
      return {
        success: false,
        message: 'Please provide a valid schedule id',
      };
    }
    const schedule = await this.scheduleModel.findById(scheduleId);
    if (!schedule) {
      return {
        success: false,
        message: 'Schedule not found',
      };
    }
    if (schedule.event.toString() !== eventId) {
      return {
        success: false,
        message: 'This schedule does not belong to this event',
      };
    }
    await this.scheduleModel.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(scheduleId),
    });
    await this.eventModel.updateOne(
      { _id: new mongoose.Types.ObjectId(eventId) },
      { $pull: { eventSchedule: new mongoose.Types.ObjectId(scheduleId) } },
    );
    return {
      success: true,
      message: 'Schedule deleted successfully',
    };
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

  private async getBusinessCreatorDetails(
    businessProfileId: string,
    currentUserId: string,
  ) {
    const businessProfile =
      await this.businessModel.findById(businessProfileId);
    if (!businessProfile) return null;

    const isFollowedByMe = await this.followModel.findOne({
      followerType: User.name,
      follower: new mongoose.Types.ObjectId(currentUserId),
      followingType: Business.name,
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
    console.log('USER:', user);

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
    console.log('currentDate:', currentDate);
    let scheduleQuery: any = {
      businessId: new mongoose.Types.ObjectId(user.businessProfile),
    };

    if (isExpired) {
      scheduleQuery = {
        $or: [
          {
            'fixedSchedule.date': { $lt: currentDate },
          },
          {
            'recurringSchedule.endDate': { $lt: currentDate },
          },
        ],
      };
    } else {
      scheduleQuery = {
        // $or: [
        // {
        'fixedSchedule.date': { $gte: currentDate },
        // },
        // {
        //   'recurringSchedule.startDate': { $lte: currentDate },
        //   'recurringSchedule.endDate': { $lte: currentDate },
        // },
        // ],
      };
    }
    console.log('scheduleQuery:', scheduleQuery);

    // Find schedules matching the filter
    const eventSchedules = await this.eventScheduleModel
      .find(scheduleQuery)
      .select('event');
    console.log('eventSchedule:', eventSchedules);

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
      const creatorDetails =
        event.creatorType === 'User'
          ? await this.getUserCreatorDetails(event.user.toString(), user.id)
          : await this.getBusinessCreatorDetails(
              event.businessProfile.toString(),
              user.id,
            );

      eventObj['creatorDetails'] = creatorDetails;

      // Fetch event's schedule data
      const eventSchedule = eventSchedules.find((s) =>
        s.event.equals(event._id),
      );

      eventObj['schedule'] = eventSchedule ? eventSchedule.toObject() : null;
      resData.push(eventObj);
    }

    // Sorting based on schedule dates
    resData = resData.sort((a, b) => {
      const aDate =
        a.schedule?.fixedSchedule?.date ||
        a.schedule?.recurringSchedule?.startDate;
      const bDate =
        b.schedule?.fixedSchedule?.date ||
        b.schedule?.recurringSchedule?.startDate;

      if (!aDate || !bDate) return 0;

      return isExpired
        ? new Date(bDate).getTime() - new Date(aDate).getTime()
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

  async getAllChildUsersIds(
    userId: string,
    collectedIds: string[] = [],
    isFirstCall = true, // Track initial call
  ): Promise<string[]> {
    if (!isFirstCall) {
      collectedIds.push(userId);
    }
    const childUsers = await this.businessUserModel
      .find({
        creator: new mongoose.Types.ObjectId(userId),
        creatorType: BusinessUserCreatorType.BUSINESS,
      })
      .select('_id');
    const childIds = childUsers.map((user) => user._id.toString());
    if (!childIds.length) {
      return collectedIds;
    }
    for (const childId of childIds) {
      await this.getAllChildUsersIds(childId, collectedIds, false);
    }
    return collectedIds;
  }
  async getAllChildUsersIds2(userId) {
    const objectId = new mongoose.Types.ObjectId(userId);
    console.log('objectIdque', objectId);
    const result = await this.businessUserModel
      .aggregate([
        {
          $match: { _id: objectId },
        },
        {
          $graphLookup: {
            from: this.businessUserModel.collection.name,
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'creator',
            as: 'descendants',
            restrictSearchWithMatch: {
              creatorType: BusinessUserCreatorType.BUSINESS,
            },
          },
        },
        {
          $project: {
            _id: 0,
            descendantIds: {
              $map: {
                input: '$descendants',
                as: 'd',
                in: { $toString: '$$d._id' },
              },
            },
          },
        },
      ])
      .exec();

    return result[0]?.descendantIds || [];
  }
  // Utility function to get the next occurrence date from a recurring schedule.
  // (This is a simplified version. In production, you might use a date library such as date-fns or moment.js to handle date arithmetic reliably.)
  private getNextOccurrence(recurringSchedule, currentDate) {
    const { startDate, endDate, weekDays } = recurringSchedule;
    // Convert dates to Date objects.
    const now = new Date(currentDate);
    const start = new Date(startDate);
    const end = new Date(endDate);

    // If the current date is before the schedule even starts, start checking from start date.
    let checkDate = now < start ? start : now;
    console.log('FRESH CHECKDATE:', checkDate);

    // We'll look at the next 7 days to see if there's an occurrence. Adjust this window as needed.
    for (let i = 0; i < 7; i++) {
      // Get the day of week as a lowercase string ('sunday', 'monday', etc.).
      let dayName = checkDate
        .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
        .toLowerCase();
      console.log('CheckDate', checkDate);
      console.log('DayName', dayName);
      console.log('EndDate:', end);
      // If this day is included in our schedule and we are still within the schedule period…
      if (weekDays[dayName] && weekDays[dayName].included && checkDate <= end) {
        // Optionally, check if the event’s time (duration.startHour / startMinute) is still upcoming on that day.
        // For example, if the duration started earlier today, you might want to ignore that occurrence.
        // You could loop through each duration entry if there are multiple.

        // For simplicity, here we just return the date:
        console.log('Inside True means there is an event::::', checkDate);
        return true;
      }
      // Move to the next day.
      checkDate.setDate(checkDate.getDate() + 1);
    }
    // If no occurrence is found within the next 7 days (or before schedule end), return null.
    return false;
  }

  // async contentManagement(
  //   user: DecodedUser,
  //   isExpired: boolean,
  //   page: number,
  //   limit: number,
  // ) {
  //   try {
  //     let query = {};
  //     // console.log('USER:', user);
  //     const businessUser = await this.businessUserModel.findById(user.id);
  //     if (!businessUser) {
  //       return {
  //         sucess: false,
  //         message: 'User not found',
  //       };
  //     }

  //     if (user.isBusiness) {
  //       console.log('Business User.role[0]', businessUser.role[0]);
  //       const userRole = await this.roleModel.findById(businessUser.role[0]);
  //       console.log('userRole:', userRole);
  //       if (userRole.isBusinessOwner) {
  //         query = {
  //           creatorType: BusinessUser.name,
  //           businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
  //         };
  //       } else {
  //         let outletIds = [];
  //         outletIds = outletIds.concat(businessUser.assignedOutlets); //doubt
  //         const childUsers = await this.getAllChildUsersIds(user.id);
  //         console.log('childUsers:', childUsers);
  //         for (let child of childUsers) {
  //           const childUser = await this.businessUserModel.findOne(
  //             { _id: new mongoose.Types.ObjectId(child) },
  //             { outlets: 1 },
  //           );
  //           if (childUser) {
  //             outletIds = outletIds.concat(childUser.assignedOutlets);
  //           }
  //         }
  //         const outletObjectIds = outletIds.map(
  //           (outletId) => new mongoose.Types.ObjectId(outletId),
  //         );
  //         query = {
  //           outlets: { $in: outletIds },
  //         };
  //       }

  //       query = {
  //         creatorType: BusinessUser.name,
  //         businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
  //       };
  //     } else {
  //       query = {
  //         creatorType: User.name,
  //         user: new mongoose.Types.ObjectId(user.id),
  //         type: EventTypes.PRIVATE,
  //       };
  //     }
  //     console.log('query:', query);

  //     const currentDate = new Date();
  //     console.log('currentDate:', currentDate);
  //     const currentUnix = currentDate.getTime();
  //     // const testingDate = new Date('2025-05-10T23:00:00.000Z').getTime();
  //     // console.log('TestingDate:', testingDate);

  //     const currentMinutes =
  //       currentDate.getUTCHours() * 60 + currentDate.getUTCMinutes();
  //     // console.log('currentMinutes:', currentMinutes);
  //     const pipeline: any[] = [
  //       {
  //         $match: query,
  //       },
  //       {
  //         $lookup: {
  //           from: 'eventschedules', // Ensure this matches your actual collection name
  //           localField: 'eventSchedule', // Field in event model storing EventSchedule ObjectIds
  //           foreignField: '_id',
  //           as: 'schedules',
  //         },
  //       },
  //       {
  //         $unwind: '$schedules',
  //       },
  //     ];

  //     if (!isExpired) {
  //       pipeline.push({
  //         $match: {
  //           $or: [
  //             // For fixed schedules: date is greater than or equal to current date (allowing today)
  //             { 'schedules.fixedSchedule.date': { $gte: currentDate } },
  //             { 'schedules.recurringSchedule.endDate': { $gte: currentDate } },
  //           ],
  //         },
  //       });
  //     }

  //     pipeline.push(
  //       {
  //         $group: {
  //           _id: '$_id',
  //           event: { $first: '$$ROOT' }, // get the full event doc once
  //           filteredSchedules: { $push: '$schedules' }, // push only matched schedules
  //         },
  //       },
  //       {
  //         $addFields: {
  //           'event.schedules': '$filteredSchedules', // overwrite event.schedules with filtered ones
  //         },
  //       },
  //       {
  //         $replaceRoot: { newRoot: '$event' }, // flatten it back to event structure
  //       },
  //     );
  //     if (!isExpired) {
  //       pipeline.push({
  //         $set: {
  //           schedules: {
  //             $filter: {
  //               input: {
  //                 $map: {
  //                   input: '$schedules',
  //                   as: 'sch',
  //                   in: {
  //                     $cond: [
  //                       { $eq: ['$$sch.type', 'fixed'] },
  //                       {
  //                         $mergeObjects: [
  //                           '$$sch',
  //                           {
  //                             fixedSchedule: {
  //                               $mergeObjects: [
  //                                 '$$sch.fixedSchedule',
  //                                 {
  //                                   durations: {
  //                                     $filter: {
  //                                       input: '$$sch.fixedSchedule.durations',
  //                                       as: 'duration',
  //                                       cond: {
  //                                         $cond: [
  //                                           {
  //                                             $eq: [
  //                                               {
  //                                                 $dateToString: {
  //                                                   date: '$$sch.fixedSchedule.date',
  //                                                   format: '%Y-%m-%d',
  //                                                 },
  //                                               },
  //                                               {
  //                                                 $dateToString: {
  //                                                   date: currentDate,
  //                                                   format: '%Y-%m-%d',
  //                                                 },
  //                                               },
  //                                             ],
  //                                           },
  //                                           {
  //                                             $gte: [
  //                                               {
  //                                                 $add: [
  //                                                   {
  //                                                     $multiply: [
  //                                                       '$$duration.endHour',
  //                                                       60,
  //                                                     ],
  //                                                   },
  //                                                   '$$duration.endMinute',
  //                                                 ],
  //                                               },
  //                                               currentMinutes,
  //                                             ],
  //                                           },
  //                                           true,
  //                                         ],
  //                                       },
  //                                     },
  //                                   },
  //                                 },
  //                               ],
  //                             },
  //                           },
  //                         ],
  //                       },
  //                       // Else: schedule is recurring. Call $function to compute if there is a future occurrence.
  //                       {
  //                         $cond: [
  //                           {
  //                             $function: {
  //                               body: new Code(`
  //                                 function(recurringSchedule, currentDate) {
  //                                   let start = new Date(recurringSchedule.startDate);
  //                                   let end = new Date(recurringSchedule.endDate);
  //                                   let weekDays = recurringSchedule.weekDays;
  //                                   let now = new Date(currentDate);
  //                                   let checkDate = now < start ? start : now;

  //                                     for (var i = 0; i < 7; i++) {
  //                                       var dayName = checkDate.toLocaleDateString("en-US", {
  //                                         weekday: "long",
  //                                         timeZone: "UTC"
  //                                       }).toLowerCase();
  //                                       if (weekDays[dayName] && weekDays[dayName].included && checkDate.getTime() <= end.getTime()) {
  //                                         return true;
  //                                       }
  //                                       checkDate.setDate(checkDate.getDate() + 1);
  //                                     }
  //                                   return false;

  //                                 //   if(currentDate === new Date('2025-05-10T23:00:00.000+00:00').getTime()) {
  //                                 //   return true;
  //                                 //   }else{
  //                                 //   return false;
  //                                 // }

  //                                 }
  //                               `),
  //                               args: ['$$sch.recurringSchedule', currentUnix],
  //                               lang: 'js',
  //                             },
  //                           },
  //                           '$$sch', // If function returns true, keep the schedule as is.
  //                           null, // Otherwise, mark it as null (to be removed later).
  //                         ],
  //                       },
  //                       // '$$sch'
  //                     ],
  //                   },
  //                 },
  //               },
  //               as: 'sch',
  //               cond: { $ne: ['$$sch', null] }, // Remove null entries.
  //             },
  //           },
  //         },
  //       });
  //     }

  //     pipeline.push(
  //       { $sort: { createdAt: -1 } },
  //       { $skip: (page - 1) * limit },
  //       { $limit: limit },
  //     );

  //     console.log('Pipeline:', JSON.stringify(pipeline));
  //     const events = await this.eventModel.aggregate(pipeline);

  //     // let updatedEvents = JSON.parse(JSON.stringify(events));
  //     // if (!isExpired) {
  //     //   updatedEvents = updatedEvents.map((event) => {
  //     //     event.schedules = event.schedules.filter((schedule) => {
  //     //       if (schedule.type === ScheduleTypes.RECURRING) {
  //     //         return this.getNextOccurrence(
  //     //           schedule.recurringSchedule,
  //     //           // currentDate,
  //     //           testingDate,
  //     //         );
  //     //       } else {
  //     //         return true;
  //     //       }
  //     //     });
  //     //     return event;
  //     //   });
  //     //   console.log('EVENT.SCHEDULESSSSS:', updatedEvents);
  //     // }

  //     return {
  //       success: true,
  //       message: 'Events fetched successfully',
  //       // data: updatedEvents,
  //       data: events,
  //     };
  //   } catch (error) {
  //     console.error('Error in contentManagement:', error);
  //     return {
  //       success: false,
  //       message: 'Something went wrong.',
  //     };
  //   }
  // }
  async contentManagement(
    user: DecodedUser,
    isExpired: boolean,
    page: number,
    limit: number,
  ) {
    try {
      // 1. Fetch business user and role
      const businessUser = await this.businessUserModel.findById(user.id);
      if (!businessUser) {
        return { success: false, message: 'User not found' };
      }
      const userRole = await this.roleModel.findById(businessUser.role[0]);

      // 2. Build base query depending on business ownership
      const now = new Date();
      let query: any;

      if (user.isBusiness) {
        if (userRole?.isBusinessOwner) {
          query = {
            creatorType: BusinessUser.name,
            businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
          };
        } else {
          // gather assigned outlets from user and children
          const childIds = await this.getAllChildUsersIds(user.id);
          const users = await this.businessUserModel.find(
            { _id: { $in: [user.id, ...childIds] } },
            { assignedOutlets: 1 },
          );
          const outletIds = users.flatMap((u) => u.assignedOutlets);
          query = {
            creatorType: BusinessUser.name,
            businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
            // outlets: {
            //   $in: outletIds.map((id) => new mongoose.Types.ObjectId(id)),
            // },
          };
        }
      } else {
        query = {
          creatorType: User.name,
          user: new mongoose.Types.ObjectId(user.id),
          type: EventTypes.PRIVATE,
        };
      }
      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      console.log('Queryy:', query);

      // 3. Build aggregation pipeline
      const pipeline: any[] = [
        { $match: query },
        {
          $lookup: {
            from: 'eventschedules',
            localField: 'eventSchedule',
            foreignField: '_id',
            as: 'schedules',
          },
        },
        // { $unwind: { path: '$schedules', preserveNullAndEmptyArrays: true } },
        // {
        //   $group: {
        //     _id: '$_id',
        //     event: { $first: '$$ROOT' },
        //     schedules: { $push: '$schedules' },
        //   },
        // },
        // {
        //   $replaceRoot: {
        //     newRoot: { $mergeObjects: ['$event', { schedules: '$schedules' }] },
        //   },
        // },
        {
          $lookup: {
            from: 'categories',
            localField: 'categories',
            foreignField: '_id',
            as: 'categories',
          },
        },
        {
          $lookup: {
            from: 'files',
            localField: 'QR_CODE',
            foreignField: '_id',
            as: 'QR_CODE',
          },
        },
        { $unwind: { path: '$QR_CODE', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'files', // assuming this is the same collection as QR_CODE
            let: { folderId: '$drivePath' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parentDirectory', '$$folderId'] },
                      {
                        $ne: [
                          '$category',
                          new mongoose.Types.ObjectId(QR_ImageCategory.id),
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'files',
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];
      const countDocuments = await this.eventModel.countDocuments(query);
      // 4. Execute aggregation
      const events = await this.eventModel.aggregate(pipeline);

      // 5. Helper filters
      const filterFixed = (sch: any) => {
        const date = new Date(sch.fixedSchedule.date);
        if (date < now) return false;
        const isToday = date.toDateString() === now.toDateString();
        return sch.fixedSchedule.durations.some((d: any) => {
          const endMin = d.endHour * 60 + d.endMinute;
          const nowMin = now.getHours() * 60 + now.getMinutes();
          return !isToday || endMin > nowMin;
        });
      };

      const filterRecurring = (sch: any) => {
        const rec = sch.recurringSchedule;
        const start = new Date(rec.startDate);
        const end = new Date(rec.endDate);
        if (now > end) return false;
        const check = new Date(Math.max(now.getTime(), start.getTime()));
        for (let i = 0; i < 7; i++) {
          if (check > end) break;
          const dow = check
            .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
            .toLowerCase();
          if (rec.weekDays[dow]?.included) return true;
          check.setUTCDate(check.getUTCDate() + 1);
        }
        return false;
      };

      // 6. Post-filtering by isExpired and schedules
      const result = events.filter((evt) => {
        if (evt.isExpired) return false;
        if (!evt.schedules?.length) return true;
        evt.schedules = evt.schedules.filter((sch) => {
          return sch.type === ScheduleTypes.FIXED
            ? filterFixed(sch)
            : sch.type === ScheduleTypes.RECURRING
              ? filterRecurring(sch)
              : false;
        });
        return evt.schedules.length > 0;
      });

      return {
        success: true,
        message: 'Events fetched successfully',
        data: result,
        total: countDocuments,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error in contentManagement:', error);
      return { success: false, message: 'Something went wrong.' };
    }
  }

  async createOffer(
    data: CreateOfferDto,
    user: DecodedUser,
    image: Express.Multer.File,
  ) {
    try {
      console.log('Data in createOffer:', data);
      const userId = user.id;
      if (!user.businessProfile) {
        return {
          success: false,
          message: 'Business not found.',
        };
      }
      const userDetails = await this.businessUserModel.findById(userId);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found.',
        };
      }
      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        return {
          success: false,
          message: 'Business not found.',
        };
      }
      let maxCategories = 3;
      if (data.categories) {
        let categoriesInObjectId = [];
        data.categories = data.categories.split(',');
        for (let category of data.categories) {
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
          if (categoriesInObjectId.length < maxCategories) {
            categoriesInObjectId.push(new mongoose.Types.ObjectId(category));
          }
        }
        data.categories = categoriesInObjectId;
      }
      if (data.minTargetAge && data.maxTargetAge) {
        if (data.minTargetAge > data.maxTargetAge) {
          return {
            success: false,
            message:
              'Minimum target age cannot be greater than maximum target age',
          };
        }
        data.minTargetAge = Number(data.minTargetAge);
        data.maxTargetAge = Number(data.maxTargetAge);
      }
      if (data.targetGenders) {
        let gendersArray = data.targetGenders.split(',');
        data.targetGenders = gendersArray;
      }
      if (data.eventType == EventTypes.FLASHDEAL) {
        data.quantityLimit = Number(data.quantityLimit);
      }
      data.isFree = data.isFree === 'true';
      const businessFolder = await this.driveService.createFolder(userId, {
        parentDirectory: business.drivePath,
        parentType: Folder.name,
        folderName: data.title,
      });
      let createObj: any = {
        ...data,
        type: data.eventType,
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
        drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
        creatorType: BusinessUser.name,
        user: new mongoose.Types.ObjectId(userId),
      };
      if (data.bookingSite) {
        let bookingUrls = data.bookingSite.split(',');
        createObj.bookingUrl = bookingUrls;
      }
      console.log('eventObj:', createObj);
      const event = await this.eventModel.create(createObj);
      console.log('event:', event);
      const fileCategory = await this.fileCategoryModel.findOne({
        name: 'gallery image',
      });
      if (image) {
        console.log('Image:', image);
        let qrDetails = await this.driveService.uploadAndCreateFile(
          image,
          String(event.drivePath),
          Folder.name,
          event._id,
          fileCategory._id,
        );
        await this.eventModel.updateOne(
          { _id: event._id },
          {
            $set: {
              QR_CODE: qrDetails._id,
            },
          },
        );
      }
      await this.businessModel.updateOne(
        { _id: user.businessProfile },
        {
          $set: {
            onboardingOfferStatus: OfferStatus.CREATED,
            initialOfferId: event._id,
          },
        },
      );
      return {
        success: true,
        message: 'Offer created successfully',
        data: event,
      };
    } catch (error) {
      console.log('Error in createOffer:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async updateOffer(
    offerId: string,
    data: UpdateOfferDto,
    user: DecodedUser,
    images: Express.Multer.File[],
  ) {
    try {
      console.log('Data:::::', data);
      const event = await this.eventModel.findById(offerId);
      if (!event) return { success: false, message: 'Offer not found' };

      if (!user.businessProfile) {
        return { success: false, message: 'Business not found.' };
      }

      if (data.categories) {
        let categoriesInObjectId = [];
        data.categories = data.categories
          .split(',')
          .map((cat) => new mongoose.Types.ObjectId(cat));

        for (let category of data.categories) {
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
      }

      if (
        data.minTargetAge &&
        data.maxTargetAge &&
        data.minTargetAge > data.maxTargetAge
      ) {
        return {
          success: false,
          message:
            'Minimum target age cannot be greater than maximum target age',
        };
      }

      if (data.targetGenders) {
        data.targetGenders = data.targetGenders.split(',');
      }

      if (data.eventType === EventTypes.FLASHDEAL) {
        data.quantityLimit = Number(data.quantityLimit);
      }

      if (data.isFree !== undefined) {
        data.isFree = data.isFree === 'true';
      }

      console.log('Data:', data);
      const updateObj: any = { ...data };

      if (data.bookingSite) {
        updateObj.bookingUrl = data.bookingSite.split(',');
      }

      console.log('Upate Obj:', updateObj);
      const updatedEvent = await this.eventModel.findByIdAndUpdate(
        offerId,
        updateObj,
        { new: true },
      );

      if (data.locations) {
        if (data.locations.length) {
          if (!Array.isArray(data.locations)) {
            data.locations = [data.locations];
          }
          for (let i = 0; i < data.locations.length; i++) {
            if (typeof data.locations[i] == 'string') {
              if (!mongoose.isValidObjectId(data.locations[i])) {
                return {
                  success: false,
                  message: `Please provide a valid location id, ${data.locations[i]} is not valid`,
                };
              }
            }
          }
          await this.eventLocationModel.deleteMany({
            event: new mongoose.Types.ObjectId(offerId),
          });
          await this.eventModel.updateOne(
            {
              _id: new mongoose.Types.ObjectId(offerId),
            },
            {
              $set: { locations: [] },
            },
          );
          for (let i = 0; i < data.locations.length; i++) {
            const location = data.locations[i];
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
              }
              const createdlocation = await this.eventLocationModel.create({
                event: new mongoose.Types.ObjectId(offerId),
                businessLocationId: outletDoc._id,
                businessProfile: event.businessProfile,
                location: {
                  type: 'Point',
                  coordinates: [outletDoc.longitude, outletDoc.latitude],
                },
                accuracy: outletDoc.accuracy,
                address1: outletDoc.address1,
                address2: outletDoc.address2 ? outletDoc.address2 : '',
                city: outletDoc.city,
                state: outletDoc.state,
                zip: outletDoc.postalCode,
                website: outletDoc.website,
                email: outletDoc.email,
                phone: outletDoc.phone,
              });
              console.log('created-location---->', createdlocation);
              await this.eventModel.updateOne(
                {
                  _id: new mongoose.Types.ObjectId(offerId),
                },
                {
                  $addToSet: { locations: createdlocation._id },
                },
              );
            } else {
              const locationData: LocationClass =
                location as unknown as LocationClass;
              const latitude = locationData.latitude;
              const longitude = locationData.longitude;
              delete locationData.latitude;
              delete locationData.longitude;
              const locationAddQuery = {
                event: new mongoose.Types.ObjectId(offerId),
                location: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                },
                businessProfile: event.businessProfile,
                ...locationData,
              };
              const createdlocation =
                await this.eventLocationModel.create(locationAddQuery);
              await this.eventModel.updateOne(
                {
                  _id: new mongoose.Types.ObjectId(offerId),
                },
                {
                  $addToSet: { locations: createdlocation._id },
                },
              );
              // console.log(`created-location:-------${createdlocation}`);
            }
          }
          delete data.locations;

          await this.businessModel.updateOne(
            {
              _id: new mongoose.Types.ObjectId(event.businessProfile),
            },
            {
              $set: { onboardingOfferStatus: OfferStatus.LOCATIONS },
            },
          );
        }
      }

      if (images && images.length > 0) {
        console.log('Images:', images);
        this.driveService.deleteBufferAndMultiImageUpload(
          user,
          String(event.drivePath),
          images,
        );
      }

      return {
        success: true,
        message: 'Offer updated successfully',
        data: updatedEvent,
      };
    } catch (err) {
      console.log('Error in updateOffer:', err);
      return { success: false, message: 'Something went wrong.' };
    }
  }

  async getDefaultTemplates(user: DecodedUser, page: number, limit: number) {
    const business = await this.businessModel.findById(user.businessProfile);
    let templates = null;
    let totalDocs = 0;
    if (user.isBusiness) {
      templates = await this.templateModel
        .find({
          creatorType: Admin.name,
          businessIndustry: new mongoose.Types.ObjectId(
            business.businessIndustry,
          ),
        })
        .populate('categories', '_id title')
        .populate('businessCategories', '_id title')
        .populate('businessIndustry', '_id title')
        .skip((page - 1) * limit)
        .limit(limit);
      totalDocs = await this.templateModel.countDocuments({
        creatorType: Admin.name,
        businessIndustry: new mongoose.Types.ObjectId(
          business.businessIndustry,
        ),
      });
    } else {
      templates = await this.templateModel.find({
        type: EventTypes.PRIVATE,
      });
      totalDocs = await this.templateModel.countDocuments({
        type: EventTypes.PRIVATE,
      });
    }

    return {
      success: true,
      message: 'Templates fetched successfully',
      data: templates,
      total: totalDocs,
    };
  }

  async businessDownlineEventsList(
    user: DecodedUser,
    page: number,
    limit: number,
  ) {
    try {
      const result = await this.eventModel.aggregate([
        // 1) Filter down to your business’s events
        {
          $match: {
            businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
          },
        },
        {
          $lookup: {
            from: 'files',
            localField: 'drivePath',
            foreignField: 'parentDirectory',
            as: 'drivePath',
          },
        },

        // 2) In parallel: paginated docs, status grouping, and sums
        {
          $facet: {
            // (a) paginated events
            events: [{ $skip: (page - 1) * limit }, { $limit: limit }],

            // (b) count per status via a simple $group
            statusCounts: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  status: '$_id',
                  count: 1,
                  _id: 0,
                },
              },
            ],

            // (c) sums of views & engagements
            sums: [
              {
                $group: {
                  _id: null,
                  totalViews: { $sum: '$viewsCount' },
                  totalEngagements: { $sum: '$engagementCount' },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalViews: 1,
                  totalEngagements: 1,
                },
              },
            ],
          },
        },

        // 3) Unpack the single-element `sums` array and rename
        {
          $project: {
            events: 1,
            statusCounts: 1,
            totalViews: { $arrayElemAt: ['$sums.totalViews', 0] },
            totalEngagements: { $arrayElemAt: ['$sums.totalEngagements', 0] },
          },
        },
      ]);

      const totalDocs = await this.eventModel.countDocuments({
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
      });

      return {
        success: true,
        message: 'Event fetched successfully',
        event: result[0].events,
        totalViews: result[0].totalViews,
        totalEngagements: result[0].totalEngagements,
        statusCount: result[0].statusCounts,
        total: totalDocs,
      };
    } catch (error) {
      console.error('Error in businessDownlineEventsList:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async crawlEvents() {
    try {
      const businessUser = await this.businessUserModel.findOne({
        email: process.env.PINNTAG_BUSINESS_USER_EMAIL,
      });
      const businessIndustry = await this.businessIndustryModel.findOne({
        title: 'Food & Drink',
      });
      const businessCategory = await this.businessCategoryModel.findOne({
        title: 'Restaurant',
        industry: businessIndustry._id,
      });
      if (!businessUser) {
        return {
          success: false,
          message: 'Pinntag Business user not seeded',
        };
      }
      for (let data of LubbockData) {
        let businessEmail = null;
        if (data.organizerEmail) {
          businessEmail = data.organizerEmail;
        } else {
          const firstWord = data.owner.name.trim().split(' ')[0].toLowerCase();
          businessEmail = `${firstWord}@yopmail.com`;
        }
        let businessDetails = await this.businessModel.findOne({
          email: businessEmail,
        });
        if (!businessDetails) {
          console.log('BusinessUser:', businessUser);
          const businessFolder = await this.driveService.createFolder(
            businessUser.id,
            {
              parentDirectory: businessUser.drive,
              parentType: Drive.name,
              folderName: data.name,
            },
          );
          let businessObj = {
            creatorType: BusinessUser.name,
            creator: businessUser._id,
            name: data.owner.name,
            email: businessEmail,
            businessIndustry: businessIndustry._id,
            businessCategories: businessCategory._id,
            cover:
              'https://pinntag-assets.s3.us-east-1.amazonaws.com/Brand+Kit/PinnTag+Cover.png',
            isFromCrawler: true,
            drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
          };
          businessDetails = await this.businessModel.create(businessObj);
        }
        console.log('Business Details:', businessDetails);
        await this.businessUserModel.updateOne(
          { _id: businessUser._id },
          { $addToSet: { business: businessDetails._id } },
        );
        // let eventLocationData: any = {};
        if (data.address.placeId) {
          let foundOutlet = await this.outletModel.findOne({
            placeId: data.address.placeId,
          });
          if (!foundOutlet) {
            let outletObj = {
              isFromCrawler: true,
              businessProfile: businessDetails._id,
              name: data.name ?? `Loc-${data.owner.name}`,
              category: OutletCategoryList.PHYSICAL,
              city: data.address.cityName ?? 'Lubbock',
              state: data.address.stateAbbr ?? 'TX',
              country: data.address.country ?? 'United States',
              postalCode: '79491',
              countryCode: '806',
              email: businessEmail,
              address1: data.address.address ?? null,
              latitude: data.address.lat ?? 34,
              longitude: data.address.lng ?? -101,
            };
            foundOutlet = await this.outletModel.create(outletObj);
          }
          console.log('Found Outlet:', foundOutlet);
          await this.businessModel.updateOne(
            { _id: businessDetails._id },
            {
              $addToSet: { outlets: foundOutlet._id },
            },
          );

          //Event Creation

          let foundEvent = await this.eventModel.findOne({
            clientRefId: data._id,
          });
          if (foundEvent) continue;
          const businessFolder = await this.driveService.createFolder(
            businessUser.id,
            {
              parentDirectory: businessDetails.drivePath,
              parentType: Folder.name,
              folderName: data.title,
            },
          );
          console.log('Business Folder:', businessFolder);

          let randomCategoryCount = Math.floor(Math.random() * 4) + 1;
          const randomCategories = await this.categoryModel.aggregate([
            { $sample: { size: randomCategoryCount } },
          ]);
          const categoriesInObjectId = randomCategories.map((cat) => cat._id);
          console.log('CATEGORIES::::', categoriesInObjectId);
          let eventObj = {
            title: data.title,
            description: data.description,
            status: EventStatus.PUBLISHED,
            clientRefId: data._id,
            type: EventTypes.FORMAL,
            businessProfile: businessDetails._id,
            creatorType: BusinessUser.name,
            user: businessUser._id,
            categories: categoriesInObjectId,
            // status: EventStatus.PUBLISHED,
            isFromCrawler: true,
            drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
            bookingUrl: [data.eventLink ?? ''],
          };

          let createdEvent = await this.eventModel.create(eventObj);
          console.log('Created Event:', createdEvent);

          //add outlet to event
          const createdlocation = await this.eventLocationModel.create({
            event: new mongoose.Types.ObjectId(createdEvent._id),
            businessLocationId: foundOutlet._id,
            location: {
              type: 'Point',
              coordinates: [foundOutlet.longitude, foundOutlet.latitude],
            },
            accuracy: foundOutlet.accuracy,
            address1: foundOutlet.address1,
            address2: foundOutlet.address2 ? foundOutlet.address2 : '',
            city: foundOutlet.city,
            state: foundOutlet.state,
            zip: foundOutlet.postalCode,
            website: foundOutlet.website,
            email: foundOutlet.email,
            phone: foundOutlet.phone,
            isFromCrawler: true,
            businessProfile: businessDetails._id,
          });
          console.log('created-location---->', createdlocation);

          await this.eventModel.updateOne(
            {
              _id: new mongoose.Types.ObjectId(createdEvent._id),
            },
            {
              $addToSet: { locations: createdlocation._id },
            },
          );
          // create schedule::
          for (let i = 0; i < data.eventTimes.length; i++) {
            let eventTime: any = data.eventTimes[i];
            let startTime: any = eventTime.startTime;
            let endTime = eventTime.endTime;
            if (!startTime) {
              startTime = new Date();
            } else {
              startTime = new Date(startTime); // ensure it's a Date object
            }
            if (!endTime) {
              const tempEnd = new Date(startTime); // clone startTime
              tempEnd.setDate(tempEnd.getDate() + 5);
              endTime = new Date(tempEnd);
            }
            let eventScheduleObj = {
              event: createdEvent._id,
              type: ScheduleTypes.FIXED,
              fixedSchedule: {
                date: startTime,
                durations: [
                  {
                    startTime: startTime,
                    endTime: endTime,
                  },
                ],
              },
              isFromCrawler: true,
            };
            let createdSchedule =
              await this.eventScheduleModel.create(eventScheduleObj);
            await this.eventModel.updateOne(
              { _id: createdEvent._id },
              {
                $addToSet: { eventSchedule: createdSchedule._id },
              },
            );
          }

          //download and upload image
          let getFileCategory = await this.fileCategoryModel.findOne({
            name: FileCategoryTypes.GALLERY_IMAGE,
          });
          if (data.cover && data.cover.source)
            await this.driveService.downloadAndUploadImage(
              data.cover.source,
              businessUser.id,
              createdEvent.drivePath,
              getFileCategory.id,
            );
        } else {
          continue;
        }
      }

      return {
        success: true,
        message: 'Business Events Crawled Successfully.',
        // data: businessDetails,
      };
    } catch (error) {
      console.error('Error in crawlEvents:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async crawlAtlantaEvents() {
    try {
      const businessUser = await this.businessUserModel.findOne({
        email: process.env.PINNTAG_BUSINESS_USER_EMAIL,
      });
      if (!businessUser) {
        return {
          success: false,
          message: 'Pinntag Business user not seeded',
        };
      }

      const businessIndustry = await this.businessIndustryModel.findOne({
        title: 'Entertainment',
      });
      const businessCategory = await this.businessCategoryModel.findOne({
        title: 'Local Experiences',
        industry: businessIndustry._id,
      });

      const businessFolder = await this.driveService.createFolder(
        businessUser.id,
        {
          parentDirectory: businessUser.drive,
          parentType: Drive.name,
          folderName: 'Discover Atlanta',
        },
      );
      let businessObj = {
        creatorType: BusinessUser.name,
        creator: businessUser._id,
        name: 'Discover Atlanta',
        email: 'atlantaetl@pinntag.com',
        businessIndustry: businessIndustry._id,
        businessCategories: businessCategory._id,
        cover:
          'https://pinntag-assets.s3.us-east-1.amazonaws.com/Brand+Kit/PinnTag+Cover.png',
        isFromCrawler: true,
        drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
      };
      let businessDetails = await this.businessModel.create(businessObj);

      for (let data of AtlantaData) {
        if (!businessUser || !businessIndustry || !businessCategory) continue;

        await this.businessUserModel.updateOne(
          { _id: businessUser._id },
          { $addToSet: { business: businessDetails._id } },
        );

        if (!data.address.lat || !data.address.lng) continue;

        let foundOutlet = await this.outletModel.findOne({
          placeId: data.address.placeId,
        });

        if (!foundOutlet) {
          let outletName = data.address.address;
          console.log('Outlet Name:', outletName);
          foundOutlet = await this.outletModel.create({
            isFromCrawler: true,
            businessProfile: businessDetails._id,
            name: outletName || `Loc-Atlanta City Hall`,
            category: OutletCategoryList.PHYSICAL,
            city: data.address.cityName ?? 'Atlanta',
            state: data.address.stateAbbr ?? 'GA',
            country: data.address.country ?? 'United States',
            postalCode: '30303',
            countryCode: '404',
            email: 'atlanta@yopmail.com',
            address1: data.address.address ?? null,
            latitude: data.address.lat,
            longitude: data.address.lng,
          });
        }

        await this.businessModel.updateOne(
          { _id: businessDetails._id },
          { $addToSet: { outlets: foundOutlet._id } },
        );

        const existingEvent = await this.eventModel.findOne({
          clientRefId: data.nameId,
        });
        if (existingEvent) continue;

        const eventFolder = await this.driveService.createFolder(
          businessUser.id,
          {
            parentDirectory: businessDetails.drivePath,
            parentType: Folder.name,
            folderName: data.title,
          },
        );

        console.log('CATEGORIES:', data.categories);
        const cats = await this.categoryModel
          .find({ title: { $in: data.categories } })
          .select('_id')
          .lean();
        const categoriesInObjectId = cats.map((cat) => cat._id);
        console.log('CATEGORIES::::', categoriesInObjectId);
        const createdEvent = await this.eventModel.create({
          title: data.title,
          description: data.description,
          status: EventStatus.PUBLISHED,
          clientRefId: data.nameId,
          type: EventTypes.FORMAL,
          businessProfile: businessDetails._id,
          creatorType: BusinessUser.name,
          user: businessUser._id,
          categories: categoriesInObjectId,
          isFromCrawler: true,
          drivePath: new mongoose.Types.ObjectId(eventFolder.data._id),
          bookingUrl: [data.eventLink || ''],
        });

        const createdLocation = await this.eventLocationModel.create({
          event: createdEvent._id,
          businessLocationId: foundOutlet._id,
          location: {
            type: 'Point',
            coordinates: [foundOutlet.longitude, foundOutlet.latitude],
          },
          address1: foundOutlet.address1,
          city: foundOutlet.city,
          state: foundOutlet.state,
          zip: foundOutlet.postalCode,
          email: foundOutlet.email,
          isFromCrawler: true,
          businessProfile: businessDetails._id,
        });

        await this.eventModel.updateOne(
          { _id: createdEvent._id },
          { $addToSet: { locations: createdLocation._id } },
        );

        for (let time of data.eventTimes || []) {
          const startTime = new Date(time.startTime || Date.now());
          const endTime = time.endTime
            ? new Date(time.endTime)
            : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

          const createdSchedule = await this.eventScheduleModel.create({
            event: createdEvent._id,
            type: ScheduleTypes.FIXED,
            fixedSchedule: {
              date: startTime,
              durations: [{ startTime, endTime }],
            },
            isFromCrawler: true,
          });

          await this.eventModel.updateOne(
            { _id: createdEvent._id },
            { $addToSet: { eventSchedule: createdSchedule._id } },
          );
        }

        if (data.cover?.source) {
          const fileCategory = await this.fileCategoryModel.findOne({
            name: FileCategoryTypes.GALLERY_IMAGE,
          });

          await this.driveService.downloadAndUploadImage(
            data.cover.source,
            businessUser.id,
            createdEvent.drivePath,
            fileCategory.id,
          );
        }
      }

      return {
        success: true,
        message: 'Business Events Crawled Successfully.',
        // data: businessDetails,
      };
    } catch (error) {
      console.error('Error in crawlEvents:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async ETL_TRANSFORMER() {
    try {
      const businessUser = await this.businessUserModel.findOne({
        email: process.env.PINNTAG_BUSINESS_USER_EMAIL,
      });
      if (!businessUser) {
        return {
          success: false,
          message: 'Pinntag Business user not seeded',
        };
      }

      let businessDetails = await this.businessModel.findOne({
        name: 'Discover Atlanta',
        email: 'atlantaetl@pinntag.com',
      });

      const businessIndustry = await this.businessIndustryModel.findOne({
        title: 'Entertainment',
      });
      const businessCategory = await this.businessCategoryModel.findOne({
        title: 'Local Experiences',
        industry: businessIndustry._id,
      });
      if (!businessDetails) {
        const businessFolder = await this.driveService.createFolder(
          businessUser.id,
          {
            parentDirectory: businessUser.drive,
            parentType: Drive.name,
            folderName: 'Discover Atlanta',
          },
        );
        let businessObj = {
          creatorType: BusinessUser.name,
          creator: businessUser._id,
          name: 'Discover Atlanta',
          email: 'atlantaetl@pinntag.com',
          businessIndustry: businessIndustry._id,
          businessCategories: businessCategory._id,
          cover:
            'https://pinntag-assets.s3.us-east-1.amazonaws.com/Brand+Kit/PinnTag+Cover.png',
          isFromCrawler: true,
          drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
        };
        businessDetails = await this.businessModel.create(businessObj);
      }
      await this.businessUserModel.updateOne(
        { _id: businessUser._id },
        { $addToSet: { business: businessDetails._id } },
      );

      for (let data of ETL_DATA) {
        if (!businessUser || !businessIndustry || !businessCategory) continue;

        if (!data.locations[0].location.coordinates) continue;

        let foundOutlet = await this.outletModel.findOne({
          address1: data.locations[0].address1,
        });

        if (!foundOutlet) {
          let outletName = data.locations[0].address1;
          console.log('Outlet Name:', outletName);
          foundOutlet = await this.outletModel.create({
            isFromCrawler: true,
            businessProfile: businessDetails._id,
            name: outletName || `Loc-Atlanta City Hall`,
            category: OutletCategoryList.PHYSICAL,
            city: data.locations[0].city ?? 'Atlanta',
            state: data.locations[0].state ?? 'GA',
            country: 'United States',
            postalCode: '30303',
            countryCode: '404',
            email: 'atlanta@yopmail.com',
            address1: data.locations[0].address1 ?? null,
            latitude: data.locations[0].location.coordinates[1],
            longitude: data.locations[0].location.coordinates[0],
          });
        }

        await this.businessModel.updateOne(
          { _id: businessDetails._id },
          { $addToSet: { outlets: foundOutlet._id } },
        );

        const existingEvent = await this.eventModel.findOne({
          clientRefId: data._id,
        });
        if (existingEvent) continue;

        const eventFolder = await this.driveService.createFolder(
          businessUser.id,
          {
            parentDirectory: businessDetails.drivePath,
            parentType: Folder.name,
            folderName: data.title,
          },
        );

        console.log('CATEGORIES:', data.categories);
        const categoryNames = data.categories.map((cat) => cat.name);
        console.log('Category Names:', categoryNames);
        const cats = await this.categoryModel
          .find({ title: { $in: categoryNames } })
          .select('_id')
          .lean();
        const categoriesInObjectId = cats.map((cat) => cat._id);
        if (categoriesInObjectId.length === 0) {
          const defaultCategory = await this.categoryModel.findOne({
            title: 'Entertainment',
          });
          categoriesInObjectId.push(defaultCategory._id);
        }
        console.log('CATEGORIES::::', categoriesInObjectId);
        const createdEvent = await this.eventModel.create({
          title: data.title,
          description: data.description,
          status: EventStatus.PUBLISHED,
          clientRefId: data._id,
          type: EventTypes.FORMAL,
          businessProfile: businessDetails._id,
          creatorType: BusinessUser.name,
          user: businessUser._id,
          categories: categoriesInObjectId,
          isFromCrawler: true,
          drivePath: new mongoose.Types.ObjectId(eventFolder.data._id),
          bookingUrl: [data.bookingUrl[0] || ''],
          minTargetAge: 18,
          maxTargetAge: 75,
        });

        const createdLocation = await this.eventLocationModel.create({
          event: createdEvent._id,
          businessLocationId: foundOutlet._id,
          location: {
            type: 'Point',
            coordinates: [foundOutlet.longitude, foundOutlet.latitude],
          },
          address1: foundOutlet.address1,
          city: foundOutlet.city,
          state: foundOutlet.state,
          zip: foundOutlet.postalCode,
          email: foundOutlet.email,
          isFromCrawler: true,
          businessProfile: businessDetails._id,
        });

        await this.eventModel.updateOne(
          { _id: createdEvent._id },
          { $addToSet: { locations: createdLocation._id } },
        );

        for (let time of data.schedules || []) {
          const startTime = new Date(
            time.fixedSchedule.durations[0].startTime || Date.now(),
          );
          const endTime = time.fixedSchedule.durations[0].endTime
            ? new Date(time.fixedSchedule.durations[0].endTime)
            : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

          const createdSchedule = await this.eventScheduleModel.create({
            event: createdEvent._id,
            type: ScheduleTypes.FIXED,
            fixedSchedule: {
              date: new Date(time.fixedSchedule.date),
              durations: [{ startTime, endTime }],
            },
            isFromCrawler: true,
          });

          await this.eventModel.updateOne(
            { _id: createdEvent._id },
            { $addToSet: { eventSchedule: createdSchedule._id } },
          );
        }

        if (data.images[0].url) {
          const fileCategory = await this.fileCategoryModel.findOne({
            name: FileCategoryTypes.GALLERY_IMAGE,
          });

          await this.driveService.downloadAndUploadImage(
            data.images[0].url,
            businessUser.id,
            createdEvent.drivePath,
            fileCategory.id,
          );
        }
      }

      return {
        success: true,
        message: 'Business Events Crawled Successfully.',
        // data: businessDetails,
      };
    } catch (error) {
      console.error('Error in crawlEvents:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async saveTemplate(data: PublishEventDto, user: DecodedUser) {
    try {
      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        return {
          success: false,
          message: 'Business not found.',
        };
      }
      const QR_ImageCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      console.log('QR_ImageCategory:', QR_ImageCategory);
      const [event] = await this.eventModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(data.id) } },
        {
          $lookup: {
            from: 'files',
            let: { folderId: '$drivePath' }, // expose `drivePath` from eventModel
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$parentDirectory', '$$folderId'] }, // match parentDirectory with drivePath
                      {
                        $ne: [
                          '$category',
                          new mongoose.Types.ObjectId(QR_ImageCategory.id), // exclude this category
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'files',
          },
        },
        // {
        //   $lookup:{
        //     from: 'files',
        //     let: { folderId: '$drivePath' }, // expose `drivePath` from eventModel
        //     localField: 'drivePath',
        //     foreignField: 'parentDirectory',
        //     as: 'files',
        //   }
        // }
      ]);
      if (!event) {
        return {
          success: false,
          message: 'Event not found.',
        };
      }
      if (event.status !== EventStatus.DRAFTED) {
        return {
          success: false,
          message: 'Only drafted events can be saved as templates.',
        };
      }

      let createQuery = { ...event };
      delete createQuery._id;
      delete createQuery.__v;
      if (event.creatorType === BusinessUser.name) {
        createQuery['businessProfile'] = new mongoose.Types.ObjectId(
          user.businessProfile,
        );
      } else {
        createQuery['user'] = new mongoose.Types.ObjectId(user.id);
      }
      console.log('event:', event);
      let thumbnailURL = null;
      if (event.files && event.files.length > 0) {
        thumbnailURL = event.files[0].metaData.url;
      }
      // let thumbnailURL = (event as any).files[0].metaData.url;
      console.log('thumbnailURL:', thumbnailURL);

      const createdTemplate = await this.templateModel.create({
        ...createQuery,
        user: new mongoose.Types.ObjectId(user.id),
        creatorType: BusinessUser.name,
        businessIndustry: business.businessIndustry,
        businessCategories: business.businessCategories,
        // creatorType: user.isBusiness ? BusinessUser.name : User.name,
        thumbnail: thumbnailURL,
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
      });

      return {
        success: true,
        message: 'Template saved successfully',
        data: createdTemplate,
        status: EventStatus.PUBLISHED,
      };
    } catch (error) {
      console.error('Error in saveTemplate:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getRandomDatesBetween(
    startDateStr: string,
    endDateStr: string,
    count: number = 3,
  ) {
    const startDate = new Date(startDateStr).getTime();
    const endDate = new Date(endDateStr).getTime();
    const dates: Set<number> = new Set();

    while (dates.size < count) {
      const randomTime = startDate + Math.random() * (endDate - startDate);
      dates.add(new Date(randomTime).setHours(0, 0, 0, 0)); // strip time part
    }

    return Array.from(dates).map((timestamp) => new Date(timestamp));
  }

  // async corruptedEvents() {
  //   try {
  //     for (let event of CorruptedAtlantaEvents) {
  //       const randomDates = await this.getRandomDatesBetween(
  //         '2025-07-30',
  //         '2025-09-01',
  //       );
  //       console.log('Random Dates:', randomDates);

  //       const schedule1 = await this.eventScheduleModel.create({
  //         event: new mongoose.Types.ObjectId(event),
  //         type: ScheduleTypes.FIXED,
  //         fixedSchedule: {
  //           date: new Date(randomDates[0]),
  //           durations: [
  //             {
  //               startTime: new Date(randomDates[0]),
  //               endTime: new Date(randomDates[0]),
  //             },
  //           ],
  //         },
  //       });
  //       const schedule2 = await this.eventScheduleModel.create({
  //         event: new mongoose.Types.ObjectId(event),
  //         type: ScheduleTypes.FIXED,
  //         fixedSchedule: {
  //           date: new Date(randomDates[1]),
  //           durations: [
  //             {
  //               startTime: new Date(randomDates[1]),
  //               endTime: new Date(randomDates[1]),
  //             },
  //           ],
  //         },
  //       });
  //       const schedule3 = await this.eventScheduleModel.create({
  //         event: new mongoose.Types.ObjectId(event),
  //         type: ScheduleTypes.FIXED,
  //         fixedSchedule: {
  //           date: new Date(randomDates[2]),
  //           durations: [
  //             {
  //               startTime: new Date(randomDates[2]),
  //               endTime: new Date(randomDates[2]),
  //             },
  //           ],
  //         },
  //       });
  //       await this.eventModel.updateOne(
  //         { _id: new mongoose.Types.ObjectId(event) },
  //         {
  //           $addToSet: { eventSchedule: schedule1._id },
  //         },
  //       );
  //       await this.eventModel.updateOne(
  //         { _id: new mongoose.Types.ObjectId(event) },
  //         {
  //           $addToSet: { eventSchedule: schedule2._id },
  //         },
  //       );
  //       await this.eventModel.updateOne(
  //         { _id: new mongoose.Types.ObjectId(event) },
  //         {
  //           $addToSet: { eventSchedule: schedule3._id },
  //         },
  //       );

  //     }
  //     return {
  //       success: true,
  //       message: 'Corrupted events processed successfully.',
  //     };
  //   } catch (error) {
  //     console.error('Error in corruptedEvents:', error);
  //     return {
  //       success: false,
  //       message: 'Something went wrong.',
  //     };
  //   }
  // }
}
