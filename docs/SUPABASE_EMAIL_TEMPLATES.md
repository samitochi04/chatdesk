# Customizing Supabase Auth Emails

Supabase sends automatic emails for signup confirmation, password reset, etc.
These come from `noreply@mail.app.supabase.io` by default and look generic.

## Step 1: Configure Custom SMTP in Supabase

Go to **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**

Enable "Custom SMTP" and enter:
- **Sender email**: `contact@mallgram.org`
- **Sender name**: `ChatDesk`
- **Host**: `smtp.hostinger.com`
- **Port**: `465`
- **Username**: `contact@mallgram.org`
- **Password**: *(your SMTP password)*

This makes all Supabase auth emails come from your domain instead of `supabase.io`.

## Step 2: Customize Email Templates

Go to **Supabase Dashboard → Authentication → Email Templates**

### Confirm Signup

**Subject:** `Confirm your ChatDesk account`

**Body:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #6366f1; margin: 0; font-size: 28px;">ChatDesk</h1>
  </div>
  <h2 style="color: #1f2937; font-size: 20px;">Welcome! Confirm your email</h2>
  <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
    Thank you for signing up for ChatDesk. Please confirm your email address to get started.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #6366f1; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
      Confirm Email Address
    </a>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
    If you didn't create a ChatDesk account, you can safely ignore this email.
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
  <p style="color: #9ca3af; font-size: 11px; text-align: center;">
    © ChatDesk — WhatsApp CRM for your business
  </p>
</div>
```

### Reset Password

**Subject:** `Reset your ChatDesk password`

**Body:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #6366f1; margin: 0; font-size: 28px;">ChatDesk</h1>
  </div>
  <h2 style="color: #1f2937; font-size: 20px;">Reset your password</h2>
  <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
    We received a request to reset your password. Click the button below to choose a new one.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #6366f1; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
      Reset Password
    </a>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
    If you didn't request this, you can safely ignore this email. The link expires in 1 hour.
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
  <p style="color: #9ca3af; font-size: 11px; text-align: center;">
    © ChatDesk — WhatsApp CRM for your business
  </p>
</div>
```

### Magic Link

**Subject:** `Your ChatDesk login link`

**Body:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #6366f1; margin: 0; font-size: 28px;">ChatDesk</h1>
  </div>
  <h2 style="color: #1f2937; font-size: 20px;">Your login link</h2>
  <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
    Click the button below to log in to your ChatDesk account.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #6366f1; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
      Log In to ChatDesk
    </a>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
    If you didn't request this, you can safely ignore this email.
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
  <p style="color: #9ca3af; font-size: 11px; text-align: center;">
    © ChatDesk — WhatsApp CRM for your business
  </p>
</div>
```

### Change Email

**Subject:** `Confirm your new email for ChatDesk`

**Body:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #6366f1; margin: 0; font-size: 28px;">ChatDesk</h1>
  </div>
  <h2 style="color: #1f2937; font-size: 20px;">Confirm your new email</h2>
  <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
    Please confirm your email change by clicking the button below.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #6366f1; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
      Confirm New Email
    </a>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
    If you didn't request this change, please contact support immediately.
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
  <p style="color: #9ca3af; font-size: 11px; text-align: center;">
    © ChatDesk — WhatsApp CRM for your business
  </p>
</div>
```
