import logging
from livekit.agents import function_tool, RunContext, get_job_context
import json
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
import asyncio

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


@function_tool()
async def send_session_summary(
    context: RunContext,
    to_email: str,
    topics_covered: str,
    key_concepts: str,
    content_reviewed: str,
    next_steps: str,
    user_name: Optional[str] = "Learner",
) -> str:
    """Send a session summary email to the user after the tutoring session.

    Args:
        to_email: Recipient email address.
        topics_covered: Comma-separated list of topics discussed.
        key_concepts: Key concepts explained during the session.
        content_reviewed: Description of code/content reviewed.
        next_steps: Recommended next steps for learning.
        user_name: Optional name of the user.
    """
    try:
        gmail_user = os.getenv("GMAIL_USER")
        gmail_password = os.getenv("GMAIL_APP_PASSWORD")

        if not gmail_user or not gmail_password:
            logging.error("Gmail credentials not found in environment variables")
            return "Email sending failed: Gmail credentials not configured."

        subject = f"Your AI Tutor Session Summary — {datetime.now().strftime('%B %d, %Y')}"

        html_body = f"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0e7490,#06b6d4);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
              <h1 style="margin:0 0 4px 0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Prep<span style="color:#a5f3fc;">X</span></h1>
              <p style="margin:0;font-size:13px;color:#cffafe;letter-spacing:1.5px;text-transform:uppercase;">AI Tutor Session Report</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#111111;padding:40px;border-left:1px solid #222;border-right:1px solid #222;">
              <!-- Greeting -->
              <p style="margin:0 0 24px 0;font-size:16px;color:#e4e4e7;line-height:1.6;">Dear {user_name},</p>
              <p style="margin:0 0 32px 0;font-size:15px;color:#a1a1aa;line-height:1.7;">Thank you for your tutoring session with PrepX. Below is a detailed summary of everything we covered, along with recommended next steps to continue your learning journey.</p>

              <!-- Topics Discussed -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-left:3px solid #06b6d4;padding-left:16px;">
                    <h2 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#06b6d4;text-transform:uppercase;letter-spacing:1px;">Topics Discussed</h2>
                    <p style="margin:0;font-size:15px;color:#d4d4d8;line-height:1.8;">{topics_covered}</p>
                  </td>
                </tr>
              </table>

              <!-- Key Concepts -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-left:3px solid #06b6d4;padding-left:16px;">
                    <h2 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#06b6d4;text-transform:uppercase;letter-spacing:1px;">Key Concepts</h2>
                    <p style="margin:0;font-size:15px;color:#d4d4d8;line-height:1.8;">{key_concepts}</p>
                  </td>
                </tr>
              </table>

              <!-- Content Reviewed -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-left:3px solid #06b6d4;padding-left:16px;">
                    <h2 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#06b6d4;text-transform:uppercase;letter-spacing:1px;">Content Reviewed</h2>
                    <p style="margin:0;font-size:15px;color:#d4d4d8;line-height:1.8;">{content_reviewed}</p>
                  </td>
                </tr>
              </table>

              <!-- Recommended Next Steps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border-left:3px solid #06b6d4;padding-left:16px;">
                    <h2 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#06b6d4;text-transform:uppercase;letter-spacing:1px;">Recommended Next Steps</h2>
                    <p style="margin:0;font-size:15px;color:#d4d4d8;line-height:1.8;">{next_steps}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 0 0;">
                    <a href="https://prepx.live" style="display:inline-block;background-color:#06b6d4;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;">Continue Learning on PrepX</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#0a0a0a;border-top:1px solid #222;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:13px;color:#71717a;">This session summary was generated by your AI Tutor on PrepX.</p>
              <p style="margin:0;font-size:12px;color:#52525b;">PrepX  |  AI-Powered Learning Platform</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

        msg = MIMEMultipart("alternative")
        msg["From"] = gmail_user
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(gmail_user, gmail_password)
        server.sendmail(gmail_user, [to_email], msg.as_string())
        server.quit()

        logging.info(f"Session summary sent to {to_email}")

        room = get_job_context().room
        participant_identity = next(iter(room.remote_participants))

        try:
            await asyncio.sleep(3)
            response = await room.local_participant.perform_rpc(
                destination_identity=participant_identity,
                method="client.showNotification",
                payload=json.dumps({
                    "type": "session_summary_sent",
                    "email_address": to_email,
                }),
                response_timeout=30.0,
            )
            logging.info(f"RPC response: {response}")
            return f"Session summary sent to {to_email} and notification shown."
        except Exception as rpc_error:
            logging.error(f"RPC error: {rpc_error}")
            return f"Session summary sent to {to_email}, but notification failed: {str(rpc_error)}"

    except smtplib.SMTPAuthenticationError:
        logging.error("Gmail authentication failed")
        return "Email sending failed: Authentication error. Please check your Gmail credentials."
    except smtplib.SMTPException as e:
        logging.error(f"SMTP error occurred: {e}")
        return f"Email sending failed: SMTP error - {str(e)}"
    except Exception as e:
        logging.error(f"Error sending email: {e}")
        return f"An error occurred while sending email: {str(e)}"
