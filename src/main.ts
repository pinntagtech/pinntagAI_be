import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { instance } from './logger/winston.logger';
import helmet from 'helmet';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
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
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
    }),
  );
  const apiPath = 'api';
  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Pinntag')
    .setDescription('Pinntag API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(`/${apiPath}/docs`, app, document);
  await app.listen(process.env.PORT || 9009);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log('Application host:---', app.getHttpServer().address());
}
bootstrap();
