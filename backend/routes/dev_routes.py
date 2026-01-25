"""
Development/Testing Routes
Only available in development mode
"""

import os
import socket
import smtplib
from email.message import EmailMessage
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import get_current_active_user
from payment_processor import process_payment_success
import logging

logger = logging.getLogger(__name__)

# Only create router if in development mode
DODO_ENV = os.getenv("DODO_PAYMENTS_ENVIRONMENT", "test_mode")
if DODO_ENV == "test_mode":
    dev_router = APIRouter(prefix="/api/v1/dev", tags=["development"])
else:
    dev_router = None

def is_development_mode():
    """Check if we're in development mode"""
    return os.getenv("DODO_PAYMENTS_ENVIRONMENT", "test_mode") == "test_mode"

if dev_router:
    @dev_router.post("/upgrade-to-premium")
    async def dev_upgrade_to_premium(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        """Development endpoint to upgrade current user to premium"""
        
        if not is_development_mode():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Development endpoints not available in production"
            )
        
        try:
            logger.info(f"🧪 DEV: Upgrading user {current_user.email} to premium")
            
            if current_user.is_premium:
                return {
                    "success": True,
                    "message": "User is already premium",
                    "is_premium": True,
                    "plan_type": "pro"
                }
            
            # Process upgrade
            result = process_payment_success(
                db=db,
                user_id=current_user.id,
                dodo_payment_data={},
                force_upgrade=True
            )
            
            logger.info(f"✅ DEV: User {current_user.email} upgraded successfully")
            
            return {
                "success": True,
                "message": "Successfully upgraded to premium",
                **result
            }
            
        except Exception as e:
            logger.error(f"❌ DEV: Upgrade failed for {current_user.email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upgrade failed: {str(e)}"
            )
    
    @dev_router.post("/downgrade-to-free")
    async def dev_downgrade_to_free(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        """Development endpoint to downgrade current user to free"""
        
        if not is_development_mode():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Development endpoints not available in production"
            )
        
        try:
            logger.info(f"🧪 DEV: Downgrading user {current_user.email} to free")
            
            # Simply set premium to false
            current_user.is_premium = False
            db.commit()
            db.refresh(current_user)
            
            logger.info(f"✅ DEV: User {current_user.email} downgraded to free")
            
            return {
                "success": True,
                "message": "Successfully downgraded to free plan",
                "is_premium": False,
                "plan_type": "free"
            }
            
        except Exception as e:
            logger.error(f"❌ DEV: Downgrade failed for {current_user.email}: {e}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Downgrade failed: {str(e)}"
            )
    
    @dev_router.get("/user-status")
    async def dev_get_user_status(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        """Development endpoint to get current user status"""
        
        if not is_development_mode():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Development endpoints not available in production"
            )
        
        return {
            "user_id": current_user.id,
            "email": current_user.email,
            "is_premium": current_user.is_premium,
            "is_verified": current_user.is_verified,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "environment": DODO_ENV
        }
    
    @dev_router.get("/test-smtp-network")
    async def dev_test_smtp_network():
        """
        Development endpoint to test network connectivity and SMTP access
        This helps diagnose Railway/Docker networking issues
        """
        
        if not is_development_mode():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Development endpoints not available in production"
            )
        
        results = {
            "timestamp": os.popen("date").read().strip() if os.name != 'nt' else "N/A",
            "environment": DODO_ENV,
            "tests": {}
        }
        
        # Get SMTP configuration
        smtp_host = os.getenv("SMTP_HOST", "smtp.hostinger.com")
        smtp_port_587 = 587
        smtp_port_465 = 465
        smtp_email = os.getenv("SMTP_EMAIL", "mohit@entrext.in")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        
        logger.info(f"🧪 DEV: Testing network connectivity to {smtp_host}")
        
        # Test 1: DNS Resolution
        try:
            ip_address = socket.gethostbyname(smtp_host)
            results["tests"]["dns_resolution"] = {
                "status": "✅ SUCCESS",
                "host": smtp_host,
                "ip_address": ip_address,
                "message": f"Successfully resolved {smtp_host} to {ip_address}"
            }
            logger.info(f"✅ DNS: {smtp_host} -> {ip_address}")
        except socket.gaierror as e:
            results["tests"]["dns_resolution"] = {
                "status": "❌ FAILED",
                "host": smtp_host,
                "error": str(e),
                "message": "DNS resolution failed - container may not have internet access"
            }
            logger.error(f"❌ DNS resolution failed: {e}")
        except Exception as e:
            results["tests"]["dns_resolution"] = {
                "status": "❌ FAILED",
                "error": str(e),
                "error_type": type(e).__name__
            }
        
        # Test 2: TCP Port 587 Connectivity
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            result = sock.connect_ex((smtp_host, smtp_port_587))
            sock.close()
            
            if result == 0:
                results["tests"]["port_587_connectivity"] = {
                    "status": "✅ SUCCESS",
                    "host": smtp_host,
                    "port": smtp_port_587,
                    "message": f"Successfully connected to {smtp_host}:{smtp_port_587}"
                }
                logger.info(f"✅ Port 587: Connection successful")
            else:
                results["tests"]["port_587_connectivity"] = {
                    "status": "❌ FAILED",
                    "host": smtp_host,
                    "port": smtp_port_587,
                    "error_code": result,
                    "message": f"Cannot connect to port {smtp_port_587} - firewall or network issue"
                }
                logger.error(f"❌ Port 587: Connection failed with code {result}")
        except socket.timeout:
            results["tests"]["port_587_connectivity"] = {
                "status": "❌ TIMEOUT",
                "host": smtp_host,
                "port": smtp_port_587,
                "message": "Connection timeout - Railway may be blocking outbound SMTP"
            }
        except Exception as e:
            results["tests"]["port_587_connectivity"] = {
                "status": "❌ FAILED",
                "error": str(e),
                "error_type": type(e).__name__
            }
        
        # Test 3: TCP Port 465 Connectivity
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            result = sock.connect_ex((smtp_host, smtp_port_465))
            sock.close()
            
            if result == 0:
                results["tests"]["port_465_connectivity"] = {
                    "status": "✅ SUCCESS",
                    "host": smtp_host,
                    "port": smtp_port_465,
                    "message": f"Successfully connected to {smtp_host}:{smtp_port_465}"
                }
                logger.info(f"✅ Port 465: Connection successful")
            else:
                results["tests"]["port_465_connectivity"] = {
                    "status": "❌ FAILED",
                    "host": smtp_host,
                    "port": smtp_port_465,
                    "error_code": result,
                    "message": f"Cannot connect to port {smtp_port_465} - firewall or network issue"
                }
                logger.error(f"❌ Port 465: Connection failed with code {result}")
        except socket.timeout:
            results["tests"]["port_465_connectivity"] = {
                "status": "❌ TIMEOUT",
                "host": smtp_host,
                "port": smtp_port_465,
                "message": "Connection timeout - Railway may be blocking outbound SMTP"
            }
        except Exception as e:
            results["tests"]["port_465_connectivity"] = {
                "status": "❌ FAILED",
                "error": str(e),
                "error_type": type(e).__name__
            }
        
        # Test 4: SMTP Connection with STARTTLS (Port 587)
        if smtp_password:
            try:
                with smtplib.SMTP(smtp_host, smtp_port_587, timeout=20) as server:
                    server.set_debuglevel(0)
                    server.starttls()
                    server.login(smtp_email, smtp_password)
                    results["tests"]["smtp_starttls_auth"] = {
                        "status": "✅ SUCCESS",
                        "host": smtp_host,
                        "port": smtp_port_587,
                        "username": smtp_email,
                        "message": "SMTP authentication successful with STARTTLS"
                    }
                    logger.info(f"✅ SMTP STARTTLS: Authentication successful")
            except smtplib.SMTPAuthenticationError as e:
                results["tests"]["smtp_starttls_auth"] = {
                    "status": "❌ AUTH_FAILED",
                    "error": str(e),
                    "message": "SMTP credentials are incorrect"
                }
                logger.error(f"❌ SMTP Auth failed: {e}")
            except socket.timeout:
                results["tests"]["smtp_starttls_auth"] = {
                    "status": "❌ TIMEOUT",
                    "message": "SMTP connection timeout - network issue"
                }
            except Exception as e:
                results["tests"]["smtp_starttls_auth"] = {
                    "status": "❌ FAILED",
                    "error": str(e),
                    "error_type": type(e).__name__
                }
        else:
            results["tests"]["smtp_starttls_auth"] = {
                "status": "⚠️ SKIPPED",
                "message": "SMTP_PASSWORD not configured"
            }
        
        # Test 5: Send Test Email
        if smtp_password:
            try:
                msg = EmailMessage()
                msg["From"] = smtp_email
                msg["To"] = smtp_email  # Send to self
                msg["Subject"] = "SnippetStream Railway Network Test"
                msg.set_content(f"Test email from Railway container at {results['timestamp']}")
                
                with smtplib.SMTP(smtp_host, smtp_port_587, timeout=20) as server:
                    server.starttls()
                    server.login(smtp_email, smtp_password)
                    server.send_message(msg)
                    
                results["tests"]["send_test_email"] = {
                    "status": "✅ SUCCESS",
                    "message": f"Test email sent successfully to {smtp_email}"
                }
                logger.info(f"✅ Test email sent successfully")
            except Exception as e:
                results["tests"]["send_test_email"] = {
                    "status": "❌ FAILED",
                    "error": str(e),
                    "error_type": type(e).__name__
                }
        else:
            results["tests"]["send_test_email"] = {
                "status": "⚠️ SKIPPED",
                "message": "SMTP_PASSWORD not configured"
            }
        
        # Summary
        passed_tests = sum(1 for test in results["tests"].values() if "✅" in test.get("status", ""))
        total_tests = len(results["tests"])
        
        results["summary"] = {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": total_tests - passed_tests,
            "diagnosis": ""
        }
        
        # Provide diagnosis
        if passed_tests == 0:
            results["summary"]["diagnosis"] = "🚨 CRITICAL: No network connectivity detected. Container cannot reach the internet."
        elif "dns_resolution" in results["tests"] and "❌" in results["tests"]["dns_resolution"]["status"]:
            results["summary"]["diagnosis"] = "🚨 DNS resolution failed. Container has no internet access or DNS is blocked."
        elif all("❌" in results["tests"].get(f"port_{p}_connectivity", {}).get("status", "") for p in [587, 465]):
            results["summary"]["diagnosis"] = "🚨 SMTP ports blocked. Railway firewall may be blocking outbound SMTP traffic."
        elif "smtp_starttls_auth" in results["tests"] and "AUTH_FAILED" in results["tests"]["smtp_starttls_auth"]["status"]:
            results["summary"]["diagnosis"] = "⚠️ Network is OK, but SMTP credentials are incorrect."
        elif passed_tests == total_tests:
            results["summary"]["diagnosis"] = "✅ All tests passed! SMTP should work correctly."
        else:
            results["summary"]["diagnosis"] = "⚠️ Partial connectivity. Check individual test results."
        
        return results

# Export the router (will be None in production)
__all__ = ["dev_router"]