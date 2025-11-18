/**
 * SONNER NOTIFICATION SYSTEM - USAGE EXAMPLES
 * 
 * This file demonstrates best practices for using the Sonner notification system
 * in the TalentBrains platform.
 */

import { notify } from '../utils/notify';

// ============================================
// BASIC NOTIFICATIONS
// ============================================

export function basicNotificationExamples() {
  // Success notification
  notify.showSuccess('Operation completed successfully!');
  
  // Error notification
  notify.showError('Something went wrong. Please try again.');
  
  // Info notification
  notify.showInfo('Here is some helpful information.');
  
  // Warning notification
  notify.showWarning('Please review your input before continuing.');
}

// ============================================
// AUTHENTICATION FLOW EXAMPLES
// ============================================

export async function loginExample(email: string, password: string) {
  try {
    // Using promise-based notification for login
    const result = await notify.promise(
      // Your async login function
      fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }).then(res => res.json()),
      {
        loading: 'Authenticating...',
        success: 'Welcome back! Successfully signed in',
        error: 'Login failed. Please check your credentials.'
      }
    );
    
    return result;
  } catch (error) {
    // Error is already shown by the promise handler
    console.error('Login error:', error);
  }
}

export async function signupExample(userData: any) {
  try {
    const result = await notify.promise(
      fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      }).then(res => res.json()),
      {
        loading: 'Creating your account...',
        success: 'Account created successfully! Welcome aboard',
        error: 'Signup failed. Please try again.'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Signup error:', error);
  }
}

export function logoutExample() {
  // Simple success notification for logout
  notify.showSignOutSuccess();
}

// ============================================
// PROFILE UPDATE EXAMPLES
// ============================================

export async function updateProfileExample(profileData: any) {
  try {
    const result = await notify.promise(
      fetch('/api/profile/update', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }).then(res => res.json()),
      {
        loading: 'Updating profile...',
        success: 'Profile updated successfully!',
        error: 'Failed to update profile. Please try again.'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Profile update error:', error);
  }
}

// ============================================
// FILE UPLOAD EXAMPLES
// ============================================

export async function uploadResumeExample(file: File) {
  // Validate file before upload
  const allowedTypes = ['application/pdf', 'application/msword'];
  if (!allowedTypes.includes(file.type)) {
    notify.showError('Please upload a PDF or Word document');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    notify.showError('File size must be less than 5MB');
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('resume', file);
    
    const result = await notify.promise(
      fetch('/api/upload/resume', {
        method: 'POST',
        body: formData,
      }).then(res => res.json()),
      {
        loading: `Uploading ${file.name}...`,
        success: `${file.name} uploaded successfully!`,
        error: `Failed to upload ${file.name}`
      }
    );
    
    return result;
  } catch (error) {
    console.error('Upload error:', error);
  }
}

// ============================================
// JOB APPLICATION EXAMPLES
// ============================================

export async function submitApplicationExample(applicationData: any) {
  // Validate before submitting
  if (!applicationData.coverLetter?.trim()) {
    notify.showError('Please write a cover letter');
    return;
  }
  
  if (!applicationData.resume) {
    notify.showError('Please provide a resume');
    return;
  }
  
  try {
    const result = await notify.promise(
      fetch('/api/applications/submit', {
        method: 'POST',
        body: JSON.stringify(applicationData),
      }).then(res => res.json()),
      {
        loading: 'Submitting application...',
        success: 'Application submitted successfully!',
        error: 'Failed to submit application. Please try again.'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Application error:', error);
  }
}

export async function withdrawApplicationExample(applicationId: string) {
  try {
    const result = await notify.promise(
      fetch(`/api/applications/${applicationId}/withdraw`, {
        method: 'PUT',
      }).then(res => res.json()),
      {
        loading: 'Withdrawing application...',
        success: 'Application withdrawn successfully',
        error: 'Failed to withdraw application'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Withdraw error:', error);
  }
}

// ============================================
// JOB POSTING EXAMPLES (COMPANY)
// ============================================

export async function createJobExample(jobData: any) {
  try {
    const result = await notify.promise(
      fetch('/api/jobs/create', {
        method: 'POST',
        body: JSON.stringify(jobData),
      }).then(res => res.json()),
      {
        loading: 'Creating job posting...',
        success: 'Job posted successfully!',
        error: 'Failed to create job posting'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Job creation error:', error);
  }
}

export async function updateJobExample(jobId: string, jobData: any) {
  try {
    const result = await notify.promise(
      fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(jobData),
      }).then(res => res.json()),
      {
        loading: 'Updating job...',
        success: 'Job updated successfully!',
        error: 'Failed to update job'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Job update error:', error);
  }
}

export async function deleteJobExample(jobId: string) {
  try {
    const result = await notify.promise(
      fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      }).then(res => res.json()),
      {
        loading: 'Deleting job...',
        success: 'Job deleted successfully',
        error: 'Failed to delete job'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Job deletion error:', error);
  }
}

// ============================================
// NETWORK ERROR HANDLING
// ============================================

export async function handleNetworkErrorExample() {
  try {
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error: any) {
    // Check if it's a network error
    if (!navigator.onLine) {
      notify.showError('You are offline. Please check your internet connection.');
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      notify.showNetworkError();
    } else {
      notify.showError('An unexpected error occurred');
    }
  }
}

// ============================================
// CUSTOM DYNAMIC MESSAGES
// ============================================

export async function dynamicMessageExample(userId: string) {
  try {
    const result = await notify.promise(
      fetch(`/api/users/${userId}`).then(res => res.json()),
      {
        loading: 'Loading user data...',
        // Dynamic success message based on result
        success: (data: any) => `Welcome, ${data.name}!`,
        // Dynamic error message based on error
        error: (err: any) => {
          if (err.status === 404) {
            return 'User not found';
          } else if (err.status === 403) {
            return 'Access denied';
          }
          return 'Failed to load user data';
        }
      }
    );
    
    return result;
  } catch (error) {
    console.error('User fetch error:', error);
  }
}

// ============================================
// CLIPBOARD OPERATIONS
// ============================================

export function copyToClipboardExample(text: string) {
  navigator.clipboard.writeText(text)
    .then(() => {
      notify.showCopiedToClipboard();
    })
    .catch(() => {
      notify.showError('Failed to copy to clipboard');
    });
}

// ============================================
// SETTINGS & PREFERENCES
// ============================================

export async function saveSettingsExample(settings: any) {
  try {
    const result = await notify.promise(
      fetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }).then(res => res.json()),
      {
        loading: 'Saving settings...',
        success: 'Settings saved successfully!',
        error: 'Failed to save settings'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Settings save error:', error);
  }
}

// ============================================
// DISMISS ALL NOTIFICATIONS
// ============================================

export function dismissAllExample() {
  // Useful when navigating away or on component unmount
  notify.dismissAll();
}
