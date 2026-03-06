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

        subject = f"Your AI Tutor Session Summary - {datetime.now().strftime('%B %d, %Y')}"
        body = (
            f"Dear {user_name},\n\n"
            f"Thank you for your tutoring session! Here's a summary of what we covered:\n\n"
            f"TOPICS DISCUSSED:\n{topics_covered}\n\n"
            f"KEY CONCEPTS:\n{key_concepts}\n\n"
            f"CONTENT REVIEWED:\n{content_reviewed}\n\n"
            f"RECOMMENDED NEXT STEPS:\n{next_steps}\n\n"
            f"Keep up the great work! Feel free to come back anytime.\n\n"
            f"Best regards,\nYour AI Tutor — PrepX"
        )

        msg = MIMEMultipart()
        msg["From"] = gmail_user
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

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
