import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { }

    async sendPostApproved(userEmail: string, userName: string, postTitle: string, postUrl: string) {
        await this.mailerService.sendMail({
            to: userEmail,
            subject: 'CivicFlow - Proposal Approved!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Congratulations, ${userName}!</h2>
                    <p>Your proposal <strong>"${postTitle}"</strong> has been approved by our city planners.</p>
                    <p>It is now published and available for the public to view and vote on.</p>
                    <br>
                    <a href="${postUrl}" style="background-color: #0F172A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Proposal</a>
                    <br><br>
                    <p>Thank you for contributing to our city!</p>
                    <p>- The CivicFlow Team</p>
                </div>
            `,
        });
    }
}
