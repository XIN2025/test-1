import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let service: MailService;
  const mockMailerService = { sendMail: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService, { provide: MailerService, useValue: mockMailerService }],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should send verification email', async () => {
    mockMailerService.sendMail.mockResolvedValue(true);

    const result = await service.sendVerificationEmail('test@example.com', {
      verificationLink: 'https://example.com/verify?token=abc123',
    });

    expect(result).toBe(true);
    expect(mockMailerService.sendMail).toHaveBeenCalled();
  });
});
