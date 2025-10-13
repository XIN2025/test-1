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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send email successfully', async () => {
    mockMailerService.sendMail.mockResolvedValue(true);

    const result = await service.sendMail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email</p>',
    });

    expect(result).toBe(true);
    expect(mockMailerService.sendMail).toHaveBeenCalledWith({
      from: expect.any(String),
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email</p>',
    });
  });

  it('should return false if sending email fails', async () => {
    mockMailerService.sendMail.mockRejectedValue(new Error('SMTP Error'));

    const result = await service.sendMail({
      to: 'fail@example.com',
      subject: 'Fail Email',
      html: '<p>This should fail</p>',
    });

    expect(result).toBe(false);
    expect(mockMailerService.sendMail).toHaveBeenCalled();
  });
});
