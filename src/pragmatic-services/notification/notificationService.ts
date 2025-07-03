import { Result, ok, err } from 'neverthrow';

// 通知の種類
export type NotificationType = 
  | 'email' 
  | 'push' 
  | 'sms' 
  | 'in_app';

// 通知データ
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>; // 追加のメタデータ
  isRead: boolean;
  createdAt: Date;
}

export interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

// エラー型
export type NotificationError = 
  | { type: 'USER_NOT_FOUND' }
  | { type: 'INVALID_NOTIFICATION_TYPE' }
  | { type: 'SEND_FAILED'; provider: string; reason: string }
  | { type: 'UNKNOWN_ERROR'; message: string };

// 外部プロバイダーのインターface
export interface EmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

export interface PushProvider {
  sendPush(deviceToken: string, title: string, body: string): Promise<boolean>;
}

export interface SMSProvider {
  sendSMS(phoneNumber: string, message: string): Promise<boolean>;
}

// リポジトリ
export interface NotificationRepository {
  save(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  findByUserId(userId: string, limit?: number): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<boolean>;
  getUnreadCount(userId: string): Promise<number>;
}

export interface UserDeviceRepository {
  getDeviceTokens(userId: string): Promise<string[]>;
  getPhoneNumber(userId: string): Promise<string | null>;
  getEmailAddress(userId: string): Promise<string | null>;
}

// 通知サービス
export class NotificationService {
  constructor(
    private notificationRepo: NotificationRepository,
    private userDeviceRepo: UserDeviceRepository,
    private emailProvider: EmailProvider,
    private pushProvider: PushProvider,
    private smsProvider: SMSProvider
  ) {}

  // 通知送信 - Result型で明示的なエラーハンドリング
  async sendNotification(input: SendNotificationInput): Promise<Result<Notification, NotificationError>> {
    try {
      // 1. 通知をデータベースに保存
      const notification = await this.notificationRepo.save({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
        isRead: false
      });

      // 2. 外部プロバイダーに送信（失敗しても通知は保存される）
      const sendResult = await this.sendToProvider(input);
      if (sendResult.isErr()) {
        // ログに記録するが、in_app通知は既に保存されているので成功とする
        console.warn('Failed to send notification via provider:', sendResult.error);
      }

      return ok(notification);
    } catch (error) {
      return err({ 
        type: 'UNKNOWN_ERROR', 
        message: error instanceof Error ? error.message : 'Notification save failed' 
      });
    }
  }

  // 複数通知の一括送信
  async sendBulkNotifications(
    userIds: string[], 
    notification: Omit<SendNotificationInput, 'userId'>
  ): Promise<{ success: string[]; failed: { userId: string; error: NotificationError }[] }> {
    const results = await Promise.allSettled(
      userIds.map(userId => 
        this.sendNotification({ ...notification, userId })
      )
    );

    const success: string[] = [];
    const failed: { userId: string; error: NotificationError }[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.isOk()) {
        success.push(userIds[index]);
      } else {
        const error = result.status === 'fulfilled' && result.value.isErr()
          ? result.value.error 
          : { type: 'UNKNOWN_ERROR' as const, message: 'Promise rejected' };
        failed.push({ userId: userIds[index], error });
      }
    });

    return { success, failed };
  }

  // ユーザーの通知取得 - シンプルな実装
  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return this.notificationRepo.findByUserId(userId, limit);
  }

  // 未読件数取得
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.getUnreadCount(userId);
  }

  // 既読マーク
  async markAsRead(notificationId: string): Promise<boolean> {
    return this.notificationRepo.markAsRead(notificationId);
  }

  // プライベートメソッド：外部プロバイダーへの送信
  private async sendToProvider(input: SendNotificationInput): Promise<Result<void, NotificationError>> {
    switch (input.type) {
      case 'email':
        return this.sendEmailNotification(input);
      case 'push':
        return this.sendPushNotification(input);
      case 'sms':
        return this.sendSMSNotification(input);
      case 'in_app':
        return ok(undefined); // in_appはDB保存のみ
      default:
        return err({ type: 'INVALID_NOTIFICATION_TYPE' });
    }
  }

  private async sendEmailNotification(input: SendNotificationInput): Promise<Result<void, NotificationError>> {
    const email = await this.userDeviceRepo.getEmailAddress(input.userId);
    if (!email) {
      return err({ type: 'USER_NOT_FOUND' });
    }

    const success = await this.emailProvider.sendEmail(email, input.title, input.message);
    if (!success) {
      return err({ type: 'SEND_FAILED', provider: 'email', reason: 'Provider returned false' });
    }

    return ok(undefined);
  }

  private async sendPushNotification(input: SendNotificationInput): Promise<Result<void, NotificationError>> {
    const deviceTokens = await this.userDeviceRepo.getDeviceTokens(input.userId);
    if (deviceTokens.length === 0) {
      return err({ type: 'USER_NOT_FOUND' });
    }

    // 複数デバイスに送信
    const results = await Promise.allSettled(
      deviceTokens.map(token => 
        this.pushProvider.sendPush(token, input.title, input.message)
      )
    );

    // 少なくとも1つ成功すればOK
    const hasSuccess = results.some(result => 
      result.status === 'fulfilled' && result.value === true
    );

    if (!hasSuccess) {
      return err({ type: 'SEND_FAILED', provider: 'push', reason: 'All device sends failed' });
    }

    return ok(undefined);
  }

  private async sendSMSNotification(input: SendNotificationInput): Promise<Result<void, NotificationError>> {
    const phoneNumber = await this.userDeviceRepo.getPhoneNumber(input.userId);
    if (!phoneNumber) {
      return err({ type: 'USER_NOT_FOUND' });
    }

    const success = await this.smsProvider.sendSMS(phoneNumber, `${input.title}: ${input.message}`);
    if (!success) {
      return err({ type: 'SEND_FAILED', provider: 'sms', reason: 'Provider returned false' });
    }

    return ok(undefined);
  }
}

// 便利なヘルパー関数群
export class NotificationHelpers {
  constructor(private notificationService: NotificationService) {}

  // よく使われる通知パターンのヘルパー
  async sendWelcomeNotification(userId: string, userName: string): Promise<Result<Notification, NotificationError>> {
    return this.notificationService.sendNotification({
      userId,
      type: 'email',
      title: 'ようこそ！',
      message: `${userName}さん、登録ありがとうございます。`,
      data: { type: 'welcome' }
    });
  }

  async sendOrderConfirmation(userId: string, orderId: string): Promise<Result<Notification, NotificationError>> {
    return this.notificationService.sendNotification({
      userId,
      type: 'push',
      title: '注文確認',
      message: `注文 ${orderId} を受け付けました。`,
      data: { type: 'order_confirmation', orderId }
    });
  }

  async sendPasswordReset(userId: string, resetToken: string): Promise<Result<Notification, NotificationError>> {
    return this.notificationService.sendNotification({
      userId,
      type: 'email',
      title: 'パスワードリセット',
      message: 'パスワードリセットのリンクです。',
      data: { type: 'password_reset', resetToken }
    });
  }

  // 緊急通知（複数チャネル同時送信）
  async sendUrgentNotification(
    userId: string, 
    title: string, 
    message: string
  ): Promise<{ email: Result<Notification, NotificationError>; push: Result<Notification, NotificationError> }> {
    const [emailResult, pushResult] = await Promise.all([
      this.notificationService.sendNotification({ userId, type: 'email', title, message }),
      this.notificationService.sendNotification({ userId, type: 'push', title, message })
    ]);

    return { email: emailResult, push: pushResult };
  }
}