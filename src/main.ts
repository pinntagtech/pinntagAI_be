import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { instance } from './logger/winston.logger';
import helmet from 'helmet';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { NextFunction } from 'express';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // logger: WinstonModule.createLogger({
    //   instance: instance,
    // }),
  });
  // app.enableCors({
  //   origin: function (origin, callback) {
  //     if (1 || !origin) {
  //       if (origin != '') {
  //         callback(null, true);
  //       }
  //     } else {
  //       callback(new Error('Not allowed by CORS'));
  //     }
  //   },
  //   credentials: true,
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   preflightContinue: false,
  //   optionsSuccessStatus: 204,
  // });
  app.enableCors();
  // app.use(cookieParser());
  app.use(helmet());
  app.useStaticAssets(join(__dirname, 'uploads'), {
    prefix: '/',
  });

  //VALIDATION PIPES
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        var error = '';
        errors.map((item) => {
          Object.keys(item.constraints).forEach(function eachKey(key) {
            error += `${item.constraints[key]}; `;
          });
        });
        return new BadRequestException(error.trim());
      },
      // whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      // transform: true,
    }),
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log('API ENDPOINT:----', req.url);
    next();
  });
  app.setGlobalPrefix('v1');
  const apiPath = 'api';
  const options = new DocumentBuilder()
    .setTitle('Pinntag')
    .setDescription('Pinntag API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(`${apiPath}/docs`, app, document);
  await app.listen(process.env.PORT);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log('Application host:---', app.getHttpServer().address());
}
bootstrap();
