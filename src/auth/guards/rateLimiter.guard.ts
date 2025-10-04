// rate-limit.guard.ts
import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
  } from '@nestjs/common';
  import { RateLimiterMemory } from 'rate-limiter-flexible';
  
  @Injectable()
  export class RateLimitGuard implements CanActivate {
    private limiter = new RateLimiterMemory({
      points: 20,
      duration: 60,
    });
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
  
      try {
        await this.limiter.consume(request.ip);
        return true;
      } catch {
        // throw new Error('Too many requests, please try again later.');
        throw new BadRequestException('Too many requests');
      }
    }
  }
  