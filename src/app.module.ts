import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from '@src/app.controller';
import { AppService } from '@src/app.service';
import { AppConfig } from '@config/app.config';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { S3Module } from '@shared/s3/s3.module';
import { FileUploadModule } from '@shared/files/upload/file-upload.module';
import { FileDownloadModule } from '@shared/files/download/file-download.module';
import { QueuesModule } from '@shared/queues/queues.module';
import { MailsModule } from '@shared/mails/mails.module';
import { AdminModule } from '@modules/admin/admin.module';
import { AlbumsModule } from '@modules/albums/albums.module';
import { AuthenticationModule } from '@modules/authentication/authentication.module';
import { BlogsModule } from '@modules/blogs/blogs.module';
import { DocumentsModule } from '@modules/documents/documents.module';
import { ContactUsModule } from '@modules/contact-us/contact-us.module';
import { BusinessModule } from '@modules/business/business.module';
import { MediaModule } from '@modules/albums/media/media.module';
import { SearchModule } from '@modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    S3Module,
    FileUploadModule,
    FileDownloadModule,
    QueuesModule,
    MailsModule,
    AdminModule,
    AuthenticationModule,
    BlogsModule,
    BusinessModule,
    DocumentsModule,
    MediaModule,
    ContactUsModule,
    AlbumsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfig],
})
export class AppModule {}
