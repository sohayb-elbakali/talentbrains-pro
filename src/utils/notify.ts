import { toast } from 'sonner';

/**
 * Centralized notification utility using Sonner
 * Provides clean, modern, UX-friendly notification patterns
 */

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

  // ============================================
  // AUTHENTICATION NOTIFICATIONS
  // ============================================

  showSignInSuccess(currentUserId?: string | null): void {
    if (
      currentUserId &&
      shouldShowSignInNotification(currentUserId) &&
      this.shouldShowNotification('signin')
    ) {
      toast.success('Welcome back! Successfully signed in', {
        duration: 3000,
      });
    }
  }

  showSignOutSuccess(): void {
    if (this.shouldShowNotification('signout')) {
      toast.success('Successfully signed out. See you soon!', {
        duration: 3000,
      });
    }
  }

  showSignUpSuccess(): void {
    if (this.shouldShowNotification('signup')) {
      toast.success('Account created', {
        duration: 2000,
      });
    }
  }

  showAuthError(): void {
    toast.error('Authentication required', {
      duration: 3000,
    });
  }

  // ============================================
  // PROFILE NOTIFICATIONS
  // ============================================

  showProfileUpdateSuccess(): void {
    if (this.shouldShowNotification('profile_update')) {
      toast.success('Profile saved', {
        duration: 2000,
      });
    }
  }

  showProfileCompletionSuccess(): void {
    if (this.shouldShowNotification('profile_completion')) {
      toast.success("Profile completed", {
        duration: 2000,
      });
    }
  }

  // ============================================
  // APPLICATION NOTIFICATIONS
  // ============================================

  showApplicationSuccess(): void {
    if (this.shouldShowNotification('application_submit')) {
      toast.success('Application submitted', {
        duration: 2500,
      });
    }
  }

  showApplicationWithdrawn(): void {
    if (this.shouldShowNotification('application_withdraw')) {
      toast.success('Application withdrawn', {
        duration: 2000,
      });
    }
  }

  // ============================================
  // JOB NOTIFICATIONS
  // ============================================

  showJobCreatedSuccess(): void {
    if (this.shouldShowNotification('job_create')) {
      toast.success('Job posted', {
        duration: 2000,
      });
    }
  }

  showJobUpdatedSuccess(): void {
    if (this.shouldShowNotification('job_update')) {
      toast.success('Job updated', {
        duration: 2000,
      });
    }
  }

  showJobDeletedSuccess(): void {
    if (this.shouldShowNotification('job_delete')) {
      toast.success('Job deleted', {
        duration: 2000,
      });
    }
  }

  // ============================================
  // GENERIC NOTIFICATIONS
  // ============================================

  showSuccess(message: string): void {
    toast.success(message, {
      duration: 2000,
    });
  }

  showError(message: string): void {
    toast.error(message, {
      duration: 3500,
    });
  }

  showInfo(message: string): void {
    toast.info(message, {
      duration: 2500,
    });
  }

  showWarning(message: string): void {
    toast.warning(message, {
      duration: 3000,
    });
  }

  // ============================================
  // NETWORK & ERROR NOTIFICATIONS
  // ============================================

  showNetworkError(): void {
    toast.error('Network error', {
      duration: 3500,
    });
  }

  // ============================================
  // FILE UPLOAD NOTIFICATIONS
  // ============================================

  showUploadSuccess(fileName: string): void {
    if (this.shouldShowNotification('file_upload')) {
      toast.success(`${fileName} uploaded`, {
        duration: 2000,
      });
    }
  }

  showUploadError(fileName: string): void {
    toast.error(`Upload failed: ${fileName}`, {
      duration: 3500,
    });
  }

  // ============================================
  // MATCH NOTIFICATIONS
  // ============================================

  showNewMatch(): void {
    if (this.shouldShowNotification('new_match')) {
      toast.success('New match found', {
        duration: 2500,
      });
    }
  }

  // ============================================
  // MESSAGE NOTIFICATIONS
  // ============================================

  showNewMessage(senderName: string): void {
    if (this.shouldShowNotification('new_message')) {
      toast.info(`Message from ${senderName}`, {
        duration: 2500,
      });
    }
  }

  // ============================================
  // SETTINGS NOTIFICATIONS
  // ============================================

  showSettingsSaved(): void {
    if (this.shouldShowNotification('settings_save')) {
      toast.success('Settings saved', {
        duration: 2000,
      });
    }
  }

  showPasswordChanged(): void {
    if (this.shouldShowNotification('password_change')) {
      toast.success('Password changed', {
        duration: 2000,
      });
    }
  }

  // ============================================
  // EMAIL NOTIFICATIONS
  // ============================================

  showEmailVerificationSent(): void {
    if (this.shouldShowNotification('email_verification')) {
      toast.success('Verification email sent', {
        duration: 2500,
      });
    }
  }

  // ============================================
  // CLIPBOARD NOTIFICATIONS
  // ============================================

  showCopiedToClipboard(): void {
    if (this.shouldShowNotification('clipboard')) {
      toast.success('Copied', {
        duration: 1500,
      });
    }
  }

  // ============================================
  // PROMISE-BASED NOTIFICATIONS
  // ============================================

  /**
   * Show loading, success, and error states for async operations
   * @example
   * notify.promise(
   *   loginUser(email, password),
   *   {
   *     loading: 'Authenticating...',
   *     success: 'Welcome back!',
   *     error: 'Login failed. Please try again.'
   *   }
   * );
   */
  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ): Promise<T> {
    const toastId = toast.loading(messages.loading);
    
    try {
      const result = await promise;
      const successMessage = typeof messages.success === 'function' 
        ? messages.success(result) 
        : messages.success;
      toast.success(successMessage, { id: toastId, duration: 2000 });
      return result;
    } catch (error) {
      const errorMessage = typeof messages.error === 'function' 
        ? messages.error(error) 
        : messages.error;
      toast.error(errorMessage, { id: toastId, duration: 3500 });
      throw error;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  dismissAll(): void {
    toast.dismiss();
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();

// Export as 'notify' for convenience
export const notify = notificationManager;
