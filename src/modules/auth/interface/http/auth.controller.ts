import {Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UnauthorizedException, UseGuards, UseInterceptors} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {Request} from 'express';
import {AccessTokenStrategy} from '../../../../common/auth/strategies/access-token.strategy';
import {RefreshTokenStrategy} from '../../../../common/auth/strategies/refresh-token.strategy';
import {API_VERSIONS} from '../../../../common/http/version.constants';
import {AUTH_ROUTES} from '../../../_shared/constants';
import {AuthService} from '../../application/services/auth.service';
import {LogoutService} from '../../application/services/logout.service';
import type {TokenPayload} from '../../domain/repositories/jwt-service.port';
import {ChangePasswordDto, ForgetPasswordDto, ResendDto, SigninDto, SignupDto, VerificationDto} from '../dto/auth-request.dto';
import {
  ChangePasswordErrorResponseDto,
  ChangePasswordSuccessResponseDto,
  ChangePasswordUnverifiedResponseDto,
  ForgetPasswordErrorResponseDto,
  ForgetPasswordSuccessResponseDto,
  RefreshTokenSuccessResponseDto,
  ResendErrorResponseDto,
  ResendSuccessResponseDto,
  SigninSuccessResponseDto,
  SigninUnauthorizedResponseDto,
  SigninUserUnverifiedResponseDto,
  SignupSuccessResponseDto,
  SignupUserAlreadyExistResponseDto,
  VerificationErrorResponseDto
} from '../dto/auth-response.dto';
import {TrackLastActivityInterceptor} from './interceptors/track-last-activity.interceptor';

@ApiTags('Auth')
@Controller({
  path: AUTH_ROUTES.BASE,
  version: [API_VERSIONS.V1, API_VERSIONS.V2]
})
@UseInterceptors(TrackLastActivityInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logoutService: LogoutService
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post(AUTH_ROUTES.SIGNUP)
  @ApiOperation({
    summary: 'Sign up user',
    description: `**Purpose:** Register a new user account in the system.

**Why Use This API:**
- First step in user onboarding process
- Creates user account with email and password
- Sends OTP verification email automatically
- Required before accessing protected endpoints

**Real-Life Scenarios:**
1. **E-commerce Platform:** Customer creates account to make purchases
2. **SaaS Application:** New user signs up for a subscription service
3. **Marketplace:** Seller registers to list products
4. **Event Platform:** Attendee creates account to buy tickets

**Workflow:**
1. User submits email, password, firstName, lastName
2. System creates account (unverified state)
3. OTP sent to email automatically
4. User must verify OTP before first login

**Next Steps:**
- Call "Verify OTP" endpoint with the OTP received via email
- After verification, user can sign in

**Note:** If user already exists (including soft-deleted), account will be restored and OTP resent.`
  })
  @ApiBody({type: SignupDto})
  @ApiCreatedResponse({description: 'Sign up success', type: SignupSuccessResponseDto})
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exist',
    type: SignupUserAlreadyExistResponseDto
  })
  async signup(@Body() signupData: SignupDto): Promise<SignupSuccessResponseDto | SignupUserAlreadyExistResponseDto> {
    return this.authService.signup(signupData);
  }

  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.SIGNIN)
  @ApiOperation({
    summary: 'Sign in user',
    description: `**Purpose:** Authenticate user and obtain access tokens for API requests.

**Why Use This API:**
- Required to access protected endpoints
- Returns JWT tokens (accessToken & refreshToken)
- Tokens are automatically saved to collection variables
- User must be verified (OTP verified) to sign in

**Real-Life Scenarios:**
1. **Mobile App Login:** User enters credentials to access their account
2. **Web Dashboard:** User logs into admin panel
3. **API Integration:** Third-party service authenticates to make API calls
4. **Session Management:** User re-authenticates after token expiration

**Workflow:**
1. User provides email and password
2. System validates credentials
3. If verified, returns accessToken and refreshToken
4. Tokens saved automatically - use {{accessToken}} in subsequent requests

**Response Includes:**
- accessToken: Short-lived token (15-60 mins) for API requests
- refreshToken: Long-lived token to get new accessToken
- User data: Profile information

**Error Cases:**
- 401: Invalid credentials
- 403: User not verified (must verify OTP first)

**Security:** Tokens are stored in collection variables and automatically included in Authorization header.`
  })
  @ApiBody({type: SigninDto})
  @ApiOkResponse({description: 'Sign in success', type: SigninSuccessResponseDto})
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
    type: SigninUnauthorizedResponseDto
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Unverified user',
    type: SigninUserUnverifiedResponseDto
  })
  async signin(@Body() signinData: SigninDto): Promise<SigninSuccessResponseDto | SigninUnauthorizedResponseDto | SigninUserUnverifiedResponseDto> {
    return await this.authService.signin(signinData);
  }

  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.VERIFY_OTP)
  @ApiOperation({
    summary: 'Verify OTP',
    description: `**Purpose:** Verify user email address using OTP (One-Time Password) sent during signup.

**Why Use This API:**
- Required to activate new user account
- Verifies email ownership
- Enables user to sign in after verification
- Returns access tokens upon successful verification

**Real-Life Scenarios:**
1. **Email Verification:** New user checks email and enters 6-digit OTP code
2. **Account Activation:** User completes registration process
3. **Security Verification:** System confirms user owns the email address
4. **Password Reset:** User verifies identity before resetting password

**Workflow:**
1. User receives OTP via email after signup
2. User enters email and OTP code
3. System validates OTP (expires after set time)
4. If valid, account is verified and tokens are returned
5. User can now sign in

**OTP Details:**
- Format: 6-digit numeric code
- Expiration: Typically 5-10 minutes
- One-time use only
- Check email inbox (and spam folder)

**Development Mode:**
- In dev environment, OTP can be viewed at: {{baseUrl}}/dev/otp-viewer

**Next Steps:**
- After verification, use "Sign In" endpoint
- Or tokens are returned directly in response

**Note:** Tokens are automatically saved to collection variables for use in other requests.`
  })
  @ApiBody({type: VerificationDto})
  @ApiOkResponse({description: 'OTP verification success', type: SigninSuccessResponseDto})
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'OTP verification failed',
    type: VerificationErrorResponseDto
  })
  async verificationOtp(@Body() verificationData: VerificationDto): Promise<SigninSuccessResponseDto | VerificationErrorResponseDto> {
    return await this.authService.verificationOtp(verificationData);
  }

  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.RESEND_OTP)
  @ApiOperation({summary: 'Resend OTP email'})
  @ApiBody({type: ResendDto})
  @ApiOkResponse({description: 'OTP email sent successfully', type: ResendSuccessResponseDto})
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'OTP email sending failed',
    type: ResendErrorResponseDto
  })
  async resend(@Body() resendData: ResendDto): Promise<ResendSuccessResponseDto | ResendErrorResponseDto> {
    return await this.authService.resend(resendData);
  }

  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.FORGET_PASSWORD)
  @ApiOperation({
    summary: 'Forget password OTP email send',
    description: `
      Password recovery steps:
      
      1. Call the Forget Password API to sent OTP via email({baseUrl}/auth/${AUTH_ROUTES.FORGET_PASSWORD}).
      2. Verify the user's identity by entering the OTP received via email({baseUrl}/auth/${AUTH_ROUTES.VERIFY_OTP}).
      3. Call the Change Password API to reset the password, providing the newPassword field in request body({baseUrl}/auth/${AUTH_ROUTES.CHANGE_PASSWORD}).
    `
  })
  @ApiBody({type: ForgetPasswordDto})
  @ApiOkResponse({description: 'OTP email sent successfully', type: ForgetPasswordSuccessResponseDto})
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'OTP email sending failed',
    type: ForgetPasswordErrorResponseDto
  })
  async forgetPassword(@Body() forgetPasswordData: ForgetPasswordDto): Promise<ForgetPasswordSuccessResponseDto | ForgetPasswordErrorResponseDto> {
    return await this.authService.forgetPassword(forgetPasswordData);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenStrategy)
  @Post(AUTH_ROUTES.CHANGE_PASSWORD)
  @ApiOperation({
    summary: 'Change user password',
    description: `
      1) For forget password only newPassword is required 
      2) For change password oldPassword & newPassword both fields are required
    `
  })
  @ApiBody({type: ChangePasswordDto})
  @ApiOkResponse({
    description: 'Password changed successfully',
    type: ChangePasswordSuccessResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to change password',
    type: ChangePasswordErrorResponseDto
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Unverified user',
    type: ChangePasswordUnverifiedResponseDto
  })
  async changePassword(
    @Body() changePasswordData: ChangePasswordDto,
    @Req() req: Request & {user: TokenPayload & {isForgetPassword?: boolean}}
  ): Promise<ChangePasswordSuccessResponseDto | ChangePasswordErrorResponseDto | ChangePasswordUnverifiedResponseDto> {
    // Create application DTO from interface DTO and request context
    const appChangePasswordDto: ChangePasswordDto & {userId: number; email: string; isForgetPassword: boolean} = {
      ...changePasswordData,
      userId: req.user.id,
      email: req.user.email,
      isForgetPassword: req.user.isForgetPassword || false
    };
    const appResponse = await this.authService.changePassword(appChangePasswordDto);
    // Convert application response to interface DTO
    return {
      success: appResponse.success,
      message: appResponse.message
    };
  }

  @UseGuards(RefreshTokenStrategy)
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.REFRESH_TOKEN)
  @ApiOperation({summary: 'Refresh access token'})
  @ApiOkResponse({description: 'Access token refreshed successfully', type: RefreshTokenSuccessResponseDto})
  async refreshToken(@Req() req: Request & {user: TokenPayload}): Promise<RefreshTokenSuccessResponseDto> {
    // Explicitly instruct caches not to store auth responses
    (req.res as any)?.setHeader?.('Cache-Control', 'no-store');
    const appResponse = await this.authService.refreshToken(req);
    // Convert application response to interface DTO
    return {
      success: appResponse.success,
      message: appResponse.message,
      tokens: appResponse.tokens
    };
  }

  @Get(AUTH_ROUTES.GOOGLE)
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Start Google OAuth flow',
    description: 'Redirects to Google for authentication. This is handled externally by Google OAuth services.'
  })
  @ApiOkResponse({description: 'Initiates Google OAuth flow'})
  async googleAuth(): Promise<void> {}

  @Get(AUTH_ROUTES.GOOGLE_CALLBACK)
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handles the callback after Google authentication.'
  })
  @ApiOkResponse({description: 'Authentication successful, returns user data and tokens'})
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication failed due to invalid or expired credentials.'
  })
  async googleAuthRedirect(@Req() req: Request & {user: any}): Promise<SigninSuccessResponseDto> {
    const appResponse = await this.authService.oAuthSignin(req.user);
    // Convert application response to interface DTO
    return {
      success: appResponse.success,
      message: appResponse.message,
      tokens: appResponse.tokens,
      data: appResponse.data,
      mfa: appResponse.mfa
    };
  }

  @Get(AUTH_ROUTES.FACEBOOK)
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Start Facebook OAuth flow',
    description: 'Redirects to Facebook for authentication. This is handled externally by Facebook OAuth services.'
  })
  @ApiOkResponse({description: 'Initiates Facebook OAuth flow'})
  async facebookAuth(): Promise<void> {}

  @Get(AUTH_ROUTES.FACEBOOK_CALLBACK)
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Facebook OAuth callback',
    description: 'Handles the callback after Facebook authentication.'
  })
  @ApiOkResponse({description: 'Authentication successful, returns user data and tokens'})
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication failed due to invalid or expired credentials.'
  })
  async facebookAuthRedirect(@Req() req: Request & {user: any}): Promise<SigninSuccessResponseDto> {
    const appResponse = await this.authService.oAuthSignin(req.user);
    // Convert application response to interface DTO
    return {
      success: appResponse.success,
      message: appResponse.message,
      tokens: appResponse.tokens,
      data: appResponse.data,
      mfa: appResponse.mfa
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenStrategy)
  @Post(AUTH_ROUTES.LOGOUT_ALL)
  @ApiOperation({summary: 'Logout user from all devices'})
  @ApiOkResponse({description: 'User logged out successfully'})
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access'
  })
  async logout(@Req() req: Request & {user: TokenPayload}): Promise<{success: boolean; message: string}> {
    const user = req.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = user.id;
    const message = await this.logoutService.logoutFromAllDevices(userId);

    return {
      success: true,
      message: message
    };
  }
}
