import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { UNIT_OF_WORK_PORT } from '../../../../common/persistence/uow/di-tokens';
import { UnitOfWorkPort } from '../../../../common/persistence/uow/uow.port';
import { AUTH_MESSAGES } from '../../../_shared/constants';
import { LoginSource } from '../../domain/enums/login-source.enum';
import { EmailAlreadyExistsError } from '../../domain/errors/email-already-exists.error';
import type { EmailServicePort } from '../../domain/repositories/email.service.port';
import type { LoggerPort } from '../../domain/repositories/logger.port';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository.port';
import type { SignupSuccessResponseDto } from '../../interface/dto/auth-response.dto';
import { RegisterUserCommand } from '../commands/register-user.command';
import { EMAIL_SERVICE_PORT, LOGGER_PORT, USER_REPOSITORY_PORT } from '../di-tokens';
import { UserMapper } from '../mappers/user.mapper';
import { CommonAuthService } from '../services/common-auth.service';
import { LastActivityTrackService } from '../services/last-activity-track.service';
import { OtpDomainService } from '../services/otp-domain.service';
import { OtpService } from '../services/otp.service';
import { PasswordPolicyService } from '../services/password-policy.service';
import { UserService } from '../services/user.service';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { User } from '../../domain/entities/user.entity';
@Injectable()
export class RegisterUserUseCase {
  private readonly saltRounds: number;
  private readonly otpExpireTime: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(LOGGER_PORT)
    private readonly logger: LoggerPort,
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly passwordService: PasswordPolicyService,
    @Inject(EMAIL_SERVICE_PORT)
    private readonly emailService: EmailServicePort,
    private readonly commonAuthService: CommonAuthService,
    private readonly otpDomainService: OtpDomainService,
    private readonly lastActivityService: LastActivityTrackService,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly uow: UnitOfWorkPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort
  ) {
    this.saltRounds = this.configService.get<number>('authConfig.bcryptSaltRounds') ?? 10;
    this.otpExpireTime = this.configService.get<number>('authConfig.otp.otpExpireTime') ?? 5;
  }

  async execute(command: RegisterUserCommand): Promise<SignupSuccessResponseDto> {
    try {
      const existingUser = await this.userService.findUserByEmail(command.email);

      if (existingUser && existingUser.verified === true) {
        this.logger.error({
          message: AUTH_MESSAGES.USER_ALREADY_EXISTS,
          details: command
        });

        throw new EmailAlreadyExistsError(command.email);
      }

      const hashedPassword = await this.passwordService.hashPassword(command.password, this.saltRounds);

      // Use transaction with proper scoping (DATABASE_STANDARDS.md)
      // Following Clean Architecture: use repository.withTx() for transaction-scoped operations
      const createdUser = await this.uow.withTransaction(async tx => {
        // Get transaction-scoped repository
        const txRepo = this.userRepository.withTx(tx);

        // Find user by email (including soft-deleted) - need to query directly since
        // repository methods exclude soft-deleted users by default
        const existingPrismaUser = await tx.user.findFirst({
          where: {
            email: command.email
            // Note: Not filtering by deletedAt to include soft-deleted users
            // This allows us to restore soft-deleted users during registration
          }
        });

        const now = new Date();
        const emailVO = Email.create(command.email);
        const passwordVO = Password.create(hashedPassword);

        if (existingPrismaUser) {
          // User exists (may be soft-deleted) - update/restore it
          const existingUser = new User(
            existingPrismaUser.id,
            emailVO,
            passwordVO,
            command.firstName || existingPrismaUser.firstName,
            command.lastName || existingPrismaUser.lastName,
            false, // verified: reset to false for re-registration
            LoginSource.DEFAULT,
            existingPrismaUser.authorizerId,
            command.mfaEnabled || existingPrismaUser.mfaEnabled || false,
            existingPrismaUser.failedOtpAttempts,
            existingPrismaUser.accountLockedUntil,
            existingPrismaUser.lastActivityAt,
            '', // logoutPin: reset
            null, // deletedAt: restore if soft-deleted
            existingPrismaUser.createdAt,
            now // updatedAt: update timestamp
          );

          return await txRepo.update(existingUser);
        } else {
          // User doesn't exist - create new
          const newUser = new User(
            0, // id will be set by database
            emailVO,
            passwordVO,
            command.firstName || null,
            command.lastName || null,
            false, // verified: false initially
            LoginSource.DEFAULT,
            null, // authorizerId
            command.mfaEnabled || false,
            0, // failedOtpAttempts
            null, // accountLockedUntil
            null, // lastActivityAt
            '', // logoutPin
            null, // deletedAt: not deleted
            now, // createdAt
            now // updatedAt
          );

          return await txRepo.save(newUser);
        }
      });

      await this.sendOtp(createdUser.email.getValue());

      await this.lastActivityService.updateLastActivityInDB(createdUser.id);

      // UserMapper.toSignupResponse accepts User entities directly
      // It handles the email value object conversion internally
      const signupResponseUser = UserMapper.toSignupResponse(createdUser);

      return {
        success: true,
        message: `${AUTH_MESSAGES.SIGNUP_SUCCESSFUL} and please ${AUTH_MESSAGES.VERIFY_YOUR_USER}`,
        data: {
          user: signupResponseUser,
          otp: {
            timeout: this.otpExpireTime,
            unit: 'mins'
          }
        }
      };
    } catch (error) {
      // Log error with full context
      this.logger.error({
        message: 'Error during user registration',
        details: {
          email: command.email,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }
      });

      // Re-throw domain errors and other exceptions to be handled by the filter
      throw error;
    }
  }

  private async sendOtp(email: string): Promise<void> {
    try {
      const otp = this.otpDomainService.generateOtp(6);

      // Try to store OTP - if it fails, log but don't block registration
      // User can resend OTP later
      try {
        await this.otpService.storeOtp(email, otp, this.otpExpireTime);
      } catch (otpStorageError) {
        this.logger.error({
          message: 'Failed to store OTP in Redis, but user registration succeeded',
          details: {
            email,
            error: otpStorageError instanceof Error ? otpStorageError.message : String(otpStorageError)
          }
        });
        // Don't throw - allow registration to succeed even if OTP storage fails
        // User can use resend OTP endpoint later
      }

      // Try to send email - if it fails, log but don't block registration
      try {
        await this.emailService.sendOtpEmail(email, otp, this.otpExpireTime);
      } catch (emailError) {
        this.logger.error({
          message: 'Failed to send OTP email, but user registration succeeded',
          details: {email, error: emailError instanceof Error ? emailError.message : String(emailError)}
        });
        // Don't throw - user is registered, email failure is not critical for signup
      }
    } catch (error) {
      // This catch block is for unexpected errors during OTP generation
      this.logger.error({
        message: 'Unexpected error during OTP generation',
        details: {email, error: error instanceof Error ? error.message : String(error)}
      });
      // Don't throw - allow registration to succeed, user can resend OTP
    }
  }
}
