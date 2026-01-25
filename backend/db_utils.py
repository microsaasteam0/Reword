"""
Database utility functions with retry logic for handling connection issues
"""
import time
import functools
from sqlalchemy.exc import OperationalError, DisconnectionError
from sqlalchemy.orm import Session
from typing import Callable, Any

def db_retry(max_retries: int = 3, delay: float = 1.0):
    """
    Decorator to retry database operations on connection failures
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (OperationalError, DisconnectionError) as e:
                    last_exception = e
                    print(f"🔄 Database connection error (attempt {attempt + 1}/{max_retries}): {e}")
                    
                    if attempt < max_retries - 1:
                        # If we have a database session in args, try to rollback and close it
                        for arg in args:
                            if isinstance(arg, Session):
                                try:
                                    arg.rollback()
                                    arg.close()
                                except:
                                    pass
                        
                        # Wait before retrying with exponential backoff
                        wait_time = delay * (2 ** attempt)
                        print(f"⏳ Waiting {wait_time}s before retry...")
                        time.sleep(wait_time)
                    else:
                        print(f"❌ All database retry attempts failed")
                        raise last_exception
                except Exception as e:
                    # For non-connection errors, don't retry
                    raise e
            
            # This should never be reached, but just in case
            raise last_exception
        
        return wrapper
    return decorator

def safe_db_operation(db: Session, operation: Callable, *args, **kwargs):
    """
    Safely execute a database operation with automatic retry
    """
    @db_retry(max_retries=3, delay=0.5)
    def _execute():
        return operation(db, *args, **kwargs)
    
    return _execute()