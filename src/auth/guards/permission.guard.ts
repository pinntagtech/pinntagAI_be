// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   ForbiddenException,
//   HttpStatus,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { Request } from 'express';
// import { Model } from 'mongoose';
// import { InjectModel } from '@nestjs/mongoose';
// import { AdminRole, AdminRoleDocument } from 'src/admin/models/adminRole.model';
// import {
//   BusinessRole,
//   BusinessRoleDocument,
// } from 'src/business-profile/models/businessRole.model';
// import { JwtPayload } from '../interfaces/tokenPayload.interface';
// import { JwtService } from '@nestjs/jwt';
// import { roleType } from 'src/contracts/enums/RoleType.enum';

// @Injectable()
// export class PermissionsGuard implements CanActivate {
//   constructor(
//     private reflector: Reflector,
//     @InjectModel(AdminRole.name)
//     private adminRoleModel: Model<AdminRoleDocument>,
//     @InjectModel(BusinessRole.name)
//     private businessRoleModel: Model<BusinessRoleDocument>,
//     private jwtService: JwtService,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const requiredPermissions = this.reflector.get<string[]>(
//       'permissions',
//       context.getHandler(),
//     );

//     if (!requiredPermissions || requiredPermissions.length === 0) {
//       return true; // No specific permissions required
//     }

//     const request = context.switchToHttp().getRequest<Request>();
//     const response = context.switchToHttp().getResponse();
//     const token = this.extractTokenFromHeader(request);
//     // const userId = request.user?.id;
//     // const userType = request.user?.type; // 'admin' | 'business' | 'user'
//     if (!token) {
//       return response.status(HttpStatus.UNAUTHORIZED).json({
//         message: 'Unauthorised. Please provide a token.',
//       });
//     } else {
//       try {
//         const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
//           secret: process.env.JWT_SECRET,
//         });
//         const userId = payload.id;
//         const type = payload.type;
//         if (!userId || !type) {
//           return response.status(HttpStatus.UNAUTHORIZED).json({
//             message: 'Invalid token. Please login again.',
//           });
//         }
//         let user;
//         if (type === roleType.ADMIN) {
//           user = await this.adminV2Model
//             .findById(userId)
//             .populate({ path: 'role', populate: { path: 'permissions' } });
//         } else if (type === roleType.BUSINESS) {
//         } else if (type === roleType.USER) {
//         } else {
//           return response.status(HttpStatus.UNAUTHORIZED).json({
//             message: 'Unauthorized action !',
//           });
//         }

//         if (!user) {
//           return response.status(HttpStatus.UNAUTHORIZED).json({
//             message: 'Invalid token. Please login again.',
//           });
//         }

//         if (user.isSuperAdmin) {
//           return true;
//         }

//         const userPermissions = user.role.permissions.map(
//           (p: any) => `${p.action}_${p.resource}`,
//         );
//         const hasPermission = requiredPermissions.every((perm) =>
//           userPermissions.includes(perm),
//         );

//         if (!hasPermission) {
//           return response.status(HttpStatus.UNAUTHORIZED).json({
//             message: 'You are not to allowed to access the role.',
//           });
//         }

//         return true;
//       } catch (error) {
//         console.log('error message:---', error);
//         if (error.name == 'TokenExpiredError') {
//           return response.status(HttpStatus.UNAUTHORIZED).json({
//             message: 'Token expired',
//           });
//         } else if (error.name == 'UnauthorizedException') {
//           return response.status(HttpStatus.UNAUTHORIZED).json({
//             message: error.message,
//           });
//         }
//         return response.status(HttpStatus.UNAUTHORIZED).json({
//           message: 'Invalid token. Please login again.',
//         });
//       }
//     }

//     // Check if user has required permissions
//   }

//   private extractTokenFromHeader(request: Request): string | undefined {
//     const [type, token] = request.headers.authorization?.split(' ') ?? [];
//     return type === 'Bearer' ? token : undefined;
//   }
// }
