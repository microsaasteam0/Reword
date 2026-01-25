"""
Background Tasks for SnippetStream
Handles periodic subscription expiration checks and other maintenance tasks
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from subscription_manager import SubscriptionManager

logger = logging.getLogger(__name__)

class BackgroundTaskManager:
    """Manages background tasks for the application"""
    
    def __init__(self):
        self.running = False
        self.tasks = []
    
    async def start(self):
        """Start all background tasks"""
        if self.running:
            logger.warning("Background tasks already running")
            return
        
        self.running = True
        logger.info("Starting background tasks...")
        
        # Start subscription expiration checker (runs every hour)
        subscription_task = asyncio.create_task(
            self._run_periodic_task(
                self.check_subscription_expirations,
                interval_minutes=60,  # Check every hour
                task_name="subscription_expiration_checker"
            )
        )
        self.tasks.append(subscription_task)
        
        # Start daily cleanup task (runs every 24 hours)
        cleanup_task = asyncio.create_task(
            self._run_periodic_task(
                self.daily_cleanup,
                interval_minutes=1440,  # 24 hours
                task_name="daily_cleanup"
            )
        )
        self.tasks.append(cleanup_task)
        
        logger.info(f"Started {len(self.tasks)} background tasks")
    
    async def stop(self):
        """Stop all background tasks"""
        if not self.running:
            return
        
        self.running = False
        logger.info("Stopping background tasks...")
        
        for task in self.tasks:
            task.cancel()
        
        # Wait for tasks to complete
        await asyncio.gather(*self.tasks, return_exceptions=True)
        self.tasks.clear()
        
        logger.info("All background tasks stopped")
    
    async def _run_periodic_task(self, task_func, interval_minutes: int, task_name: str):
        """Run a task periodically"""
        interval_seconds = interval_minutes * 60
        
        logger.info(f"Starting periodic task '{task_name}' with {interval_minutes}min interval")
        
        while self.running:
            try:
                start_time = datetime.now()
                logger.info(f"Running task: {task_name}")
                
                await task_func()
                
                duration = (datetime.now() - start_time).total_seconds()
                logger.info(f"Task '{task_name}' completed in {duration:.2f}s")
                
            except Exception as e:
                logger.error(f"Error in task '{task_name}': {e}")
            
            # Wait for next interval
            if self.running:
                await asyncio.sleep(interval_seconds)
    
    async def check_subscription_expirations(self):
        """Check and expire subscriptions that have passed their end date"""
        try:
            db = next(get_db())
            manager = SubscriptionManager(db)
            
            result = manager.check_all_subscriptions()
            
            if result["success"]:
                if result["expired_count"] > 0:
                    logger.info(f"Expired {result['expired_count']} subscriptions")
                else:
                    logger.debug("No subscriptions to expire")
                
                if result["errors"]:
                    logger.warning(f"Errors during subscription check: {result['errors']}")
            else:
                logger.error(f"Subscription check failed: {result.get('error', 'Unknown error')}")
            
            db.close()
            
        except Exception as e:
            logger.error(f"Critical error in subscription expiration check: {e}")
    
    async def daily_cleanup(self):
        """Perform daily cleanup tasks"""
        try:
            logger.info("Running daily cleanup tasks...")
            
            # Add cleanup tasks here as needed
            # For example: clean up old logs, temporary files, etc.
            
            logger.info("Daily cleanup completed")
            
        except Exception as e:
            logger.error(f"Error in daily cleanup: {e}")

# Global task manager instance
task_manager = BackgroundTaskManager()

async def start_background_tasks():
    """Start background tasks - call this when the app starts"""
    await task_manager.start()

async def stop_background_tasks():
    """Stop background tasks - call this when the app shuts down"""
    await task_manager.stop()

# Manual task triggers for testing/admin use
async def manual_subscription_check():
    """Manually trigger subscription expiration check"""
    try:
        db = next(get_db())
        manager = SubscriptionManager(db)
        result = manager.check_all_subscriptions()
        db.close()
        return result
    except Exception as e:
        logger.error(f"Manual subscription check failed: {e}")
        return {"success": False, "error": str(e)}