"""
Email service for sending emails via SMTP
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from app.utils.logger import logger
from app.utils.json_handler import JSONHandler
from typing import Optional


async def send_contact_form_email(
    name: str,
    email: str,
    phone: str,
    message: str
) -> bool:
    """
    Send contact form submission email to admin
    
    Args:
        name: User's name
        email: User's email
        phone: User's phone number
        message: User's message
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.error("SMTP credentials not configured. Check SMTP_USER and SMTP_PASSWORD in .env file")
        return False
    
    # Get admin email from admin profile (first admin user's email)
    json_handler = JSONHandler(settings.DATA_DIR)
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    
    # Get email from first admin user, or fallback to CONTACT_EMAIL from .env
    admin_email = None
    if users:
        admin_email = users[0].get("email")
    
    # Fallback to CONTACT_EMAIL from .env if no admin email in profile
    if not admin_email:
        admin_email = settings.CONTACT_EMAIL
    
    if not admin_email:
        logger.error("No admin email found. Set email in admin profile or CONTACT_EMAIL in .env file")
        return False
    
    # Clean password (remove any extra spaces that might be in app password)
    smtp_password = settings.SMTP_PASSWORD.strip().replace(" ", "")
    
    # Use SMTP_FROM_EMAIL or SMTP_USER as sender
    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"New Contact Form Submission - {name}"
        msg['From'] = from_email
        msg['To'] = admin_email
        msg['Reply-To'] = email  # Set reply-to to user's email for easy replies
        
        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px 8px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                }}
                .field {{
                    margin-bottom: 15px;
                }}
                .label {{
                    font-weight: bold;
                    color: #667eea;
                    display: block;
                    margin-bottom: 5px;
                }}
                .value {{
                    color: #555;
                    padding: 10px;
                    background: white;
                    border-radius: 4px;
                    border-left: 3px solid #667eea;
                }}
                .message-box {{
                    background: white;
                    padding: 15px;
                    border-radius: 4px;
                    border-left: 3px solid #764ba2;
                    white-space: pre-wrap;
                }}
                .footer {{
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #888;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2 style="margin: 0;">New Contact Form Submission</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">You have received a new message from your website</p>
            </div>
            <div class="content">
                <div class="field">
                    <span class="label">Name:</span>
                    <div class="value">{name}</div>
                </div>
                <div class="field">
                    <span class="label">Email:</span>
                    <div class="value">
                        <a href="mailto:{email}" style="color: #667eea; text-decoration: none;">{email}</a>
                    </div>
                </div>
                <div class="field">
                    <span class="label">Phone:</span>
                    <div class="value">
                        <a href="tel:{phone}" style="color: #667eea; text-decoration: none;">{phone}</a>
                    </div>
                </div>
                <div class="field">
                    <span class="label">Message:</span>
                    <div class="message-box">{message}</div>
                </div>
            </div>
            <div class="footer">
                <p>This email was sent from your website contact form.</p>
                <p>Reply directly to this email to respond to {name}.</p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        text_body = f"""
New Contact Form Submission

You have received a new message from your website contact form.

Name: {name}
Email: {email}
Phone: {phone}

Message:
{message}

---
Reply directly to this email to respond to {name}.
This email was sent from your website contact form.
        """
        
        # Attach both versions
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email using SMTP connection
        # For port 587: Connect without TLS, then call starttls()
        # For port 465: Connect with TLS (SSL) immediately
        if settings.SMTP_PORT == 465:
            # Port 465 uses SSL/TLS from the start
            smtp = aiosmtplib.SMTP(
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                use_tls=True,
            )
            await smtp.connect()
        else:
            # Port 587: Connect first, then upgrade to TLS
            smtp = aiosmtplib.SMTP(
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
            )
            await smtp.connect()
            # Try to start TLS, but catch error if already using TLS
            try:
                await smtp.starttls()
            except Exception as tls_error:
                # If connection already uses TLS, that's fine - continue
                if "already using" not in str(tls_error).lower():
                    # Re-raise if it's a different error
                    raise
        
        # Login (use cleaned password)
        await smtp.login(settings.SMTP_USER, smtp_password)
        
        # Send message
        await smtp.send_message(msg)
        
        # Close connection
        await smtp.quit()
        
        logger.info(f"Contact form email sent successfully to {admin_email} from {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send contact form email: {str(e)}", exc_info=True)
        return False


async def send_acknowledgment_email(
    name: str,
    email: str
) -> bool:
    """
    Send acknowledgment email to customer after they submit contact form
    
    Args:
        name: Customer's name
        email: Customer's email address
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.error("SMTP credentials not configured. Check SMTP_USER and SMTP_PASSWORD in .env file")
        return False
    
    # Clean password (remove any extra spaces that might be in app password)
    smtp_password = settings.SMTP_PASSWORD.strip().replace(" ", "")
    
    # Use SMTP_FROM_EMAIL or SMTP_USER as sender
    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Thank You for Contacting Us - We've Received Your Message"
        msg['From'] = from_email
        msg['To'] = email
        
        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f4f7f6;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }}
                .header {{
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    padding: 30px;
                    color: #ffffff;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                }}
                .header p {{
                    margin: 10px 0 0 0;
                    font-size: 16px;
                    opacity: 0.95;
                }}
                .content {{
                    padding: 40px 30px;
                    color: #333333;
                    line-height: 1.8;
                }}
                .greeting {{
                    font-size: 18px;
                    color: #4CAF50;
                    font-weight: 600;
                    margin-bottom: 20px;
                }}
                .message {{
                    font-size: 16px;
                    color: #555555;
                    margin-bottom: 25px;
                }}
                .highlight-box {{
                    background-color: #f0f8ff;
                    border-left: 4px solid #2196F3;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 25px 0;
                }}
                .highlight-box p {{
                    margin: 0;
                    color: #333333;
                    font-size: 15px;
                }}
                .footer {{
                    background-color: #e9ecef;
                    padding: 25px 30px;
                    text-align: center;
                    color: #777777;
                    font-size: 13px;
                    border-top: 1px solid #dddddd;
                }}
                .footer p {{
                    margin: 5px 0;
                }}
                .icon {{
                    font-size: 48px;
                    margin-bottom: 15px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="icon">✓</div>
                    <h1>Thank You, {name}!</h1>
                    <p>We've received your message</p>
                </div>
                <div class="content">
                    <div class="greeting">Dear {name},</div>
                    <div class="message">
                        Thank you for reaching out to us through our contact form. We have successfully received your message and our team will review it shortly.
                    </div>
                    <div class="highlight-box">
                        <p><strong>What happens next?</strong></p>
                        <p style="margin-top: 10px;">
                            Our support team typically responds within 24-48 hours during business days. We appreciate your patience and look forward to assisting you.
                        </p>
                    </div>
                    <div class="message">
                        If you have any urgent inquiries, please feel free to contact us directly through our other communication channels listed on our website.
                    </div>
                    <div class="message" style="margin-top: 30px;">
                        Best regards,<br>
                        <strong>Customer Support Team</strong>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated acknowledgment email.</p>
                    <p>Please do not reply to this email. If you need to contact us, please use our contact form or other channels.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        text_body = f"""
Thank You, {name}!

We've received your message.

Dear {name},

Thank you for reaching out to us through our contact form. We have successfully received your message and our team will review it shortly.

What happens next?

Our support team typically responds within 24-48 hours during business days. We appreciate your patience and look forward to assisting you.

If you have any urgent inquiries, please feel free to contact us directly through our other communication channels listed on our website.

Best regards,
Customer Support Team

---
This is an automated acknowledgment email.
Please do not reply to this email. If you need to contact us, please use our contact form or other channels.
        """
        
        # Attach both versions
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email using SMTP connection
        # For port 587: Connect without TLS, then call starttls()
        # For port 465: Connect with TLS (SSL) immediately
        if settings.SMTP_PORT == 465:
            # Port 465 uses SSL/TLS from the start
            smtp = aiosmtplib.SMTP(
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                use_tls=True,
            )
            await smtp.connect()
        else:
            # Port 587: Connect first, then upgrade to TLS
            smtp = aiosmtplib.SMTP(
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
            )
            await smtp.connect()
            # Try to start TLS, but catch error if already using TLS
            try:
                await smtp.starttls()
            except Exception as tls_error:
                # If connection already uses TLS, that's fine - continue
                if "already using" not in str(tls_error).lower():
                    # Re-raise if it's a different error
                    raise
        
        # Login (use cleaned password)
        await smtp.login(settings.SMTP_USER, smtp_password)
        
        # Send message
        await smtp.send_message(msg)
        
        # Close connection
        await smtp.quit()
        
        logger.info(f"Acknowledgment email sent successfully to {email} (customer: {name})")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send acknowledgment email to {email}: {str(e)}", exc_info=True)
        return False

