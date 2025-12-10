import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                transport: {
                    host: config.get('SMTP_HOST'), // Mapped to SMTP_HOST
                    port: config.get('SMTP_PORT'), // Mapped to SMTP_PORT
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: config.get('SMTP_USER'), // Mapped to SMTP_USER
                        pass: config.get('SMTP_PASS'), // Mapped to SMTP_PASS
                    },
                },
                defaults: {
                    from: config.get('SMTP_FROM'), // Mapped to SMTP_FROM
                },
                template: {
                    dir: join(__dirname, 'templates'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [MailController],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }
