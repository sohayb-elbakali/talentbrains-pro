import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

// Create Notyf instance with custom configuration
const notyf = new Notyf({
  duration: 2000,
  position: {
    x: 'right',
    y: 'top',
  },
  dismissible: true,
  ripple: true,
  types: [
    {
      type: 'success',
      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      icon: {
        className: 'notyf__icon--success',
        tagName: 'i',
      },
    },
    {
      type: 'error',
      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      icon: {
        className: 'notyf__icon--error',
        tagName: 'i',
      },
    },
    {
      type: 'warning',
      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      icon: false,
    },
    {
      type: 'info',
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      icon: false,
    },
  ],
});

// Persistent variable to track last signed-in user across reloads
let lastSignedInUserId: string | null = null;

export function shouldShowSignInNotification(
  currentUserId: string | null
): boolean {
  if (!currentUserId) return false;
  if (lastSignedInUserId !== currentUserId) {
    lastSignedInUserId = currentUserId;
    return true;
  }
  return false;
}

// Enhanced notification manager with Notyf
class NotificationManager {
  private lastNotifications: Map<string, number> = new Map();
  private readonly debounceTime = 3000;

  private shouldShowNotification(type: string): boolean {
    const now = Date.now();
    const lastTime = this.lastNotifications.get(type) || 0;

    if (now - lastTime > this.debounceTime) {
      this.lastNotifications.set(type, now);
      return true;
    }
    return false;
  }

  // Authentication notifications
  showSignInSuccess(currentUserId?: string | null): void {
    if (
      currentUserId &&
      shouldShowSignInNotification(currentUserId) &&
      this.shouldShowNotification("signin")
    ) {
      notyf.success('🎉 Welcome back! Successfully signed in');
    }
  }

  showSignOutSuccess(): void {
    if (this.shouldShowNotification("signout")) {
      notyf.success('👋 Successfully signed out. See you soon!');
    }
  }

  showSignUpSuccess(): void {
    if (this.shouldShowNotification("signup")) {
      notyf.success('🎊 Account created successfully! Welcome aboard');
    }
  }

  // Profile notifications
  showProfileUpdateSuccess(): void {
    if (this.shouldShowNotification("profile_update")) {
      notyf.success('✅ Profile updated successfully!');
    }
  }

  showProfileCompletionSuccess(): void {
    if (this.shouldShowNotification("profile_completion")) {
      notyf.success('🎯 Profile completed! You\'re all set');
    }
  }

  // Application notifications
  showApplicationSuccess(): void {
    if (this.shouldShowNotification("application_submit")) {
      notyf.success('🚀 Application submitted successfully!');
    }
  }

  showApplicationWithdrawn(): void {
    if (this.shouldShowNotification("application_withdraw")) {
      notyf.success('Application withdrawn successfully');
    }
  }

  // Job notifications
  showJobCreatedSuccess(): void {
    if (this.shouldShowNotification("job_create")) {
      notyf.success('✨ Job posted successfully!');
    }
  }

  showJobUpdatedSuccess(): void {
    if (this.shouldShowNotification("job_update")) {
      notyf.success('✅ Job updated successfully!');
    }
  }

  showJobDeletedSuccess(): void {
    if (this.shouldShowNotification("job_delete")) {
      notyf.success('Job deleted successfully');
    }
  }

  // Error notifications
  showError(message: string): void {
    notyf.error(`❌ ${message}`);
  }

  showAuthError(): void {
    notyf.error('🔒 Authentication required. Please sign in');
  }

  showNetworkError(): void {
    notyf.error('🌐 Network error. Please check your connection');
  }

  // Success with custom message
  showSuccess(message: string): void {
    notyf.success(`✅ ${message}`);
  }

  // Info notifications
  showInfo(message: string): void {
    notyf.open({
      type: 'info',
      message: `ℹ️ ${message}`,
    });
  }

  // Warning notifications
  showWarning(message: string): void {
    notyf.open({
      type: 'warning',
      message: `⚠️ ${message}`,
    });
  }

  // File upload notifications
  showUploadSuccess(fileName: string): void {
    if (this.shouldShowNotification("file_upload")) {
      notyf.success(`📁 ${fileName} uploaded successfully!`);
    }
  }

  showUploadError(fileName: string): void {
    notyf.error(`❌ Failed to upload ${fileName}`);
  }

  // Match notifications
  showNewMatch(): void {
    if (this.shouldShowNotification("new_match")) {
      notyf.success('🎯 New match found! Check it out');
    }
  }

  // Message notifications
  showNewMessage(senderName: string): void {
    if (this.shouldShowNotification("new_message")) {
      notyf.open({
        type: 'info',
        message: `💬 New message from ${senderName}`,
      });
    }
  }

  // Settings notifications
  showSettingsSaved(): void {
    if (this.shouldShowNotification("settings_save")) {
      notyf.success('⚙️ Settings saved successfully!');
    }
  }

  // Password notifications
  showPasswordChanged(): void {
    if (this.shouldShowNotification("password_change")) {
      notyf.success('🔐 Password changed successfully!');
    }
  }

  // Email notifications
  showEmailVerificationSent(): void {
    if (this.shouldShowNotification("email_verification")) {
      notyf.success('📧 Verification email sent! Check your inbox');
    }
  }

  // Copy to clipboard
  showCopiedToClipboard(): void {
    if (this.shouldShowNotification("clipboard")) {
      notyf.success('📋 Copied to clipboard!');
    }
  }

  // Dismiss all notifications
  dismissAll(): void {
    notyf.dismissAll();
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
