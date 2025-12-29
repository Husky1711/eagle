"""
Atomic JSON file read/write utilities with file locking
"""
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import platform
from app.utils.logger import logger

# Platform-specific imports
if platform.system() == "Windows":
    import msvcrt  # Windows file locking
else:
    import fcntl  # Unix file locking


class JSONHandler:
    """Thread-safe JSON file handler with atomic writes"""
    
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.is_windows = platform.system() == "Windows"
    
    def _lock_file(self, file_handle):
        """Lock file for exclusive access"""
        if self.is_windows:
            try:
                msvcrt.locking(file_handle.fileno(), msvcrt.LK_LOCK, 1)
            except (OSError, IOError):
                pass  # File locking may fail on some Windows systems, continue anyway
        else:
            try:
                fcntl.flock(file_handle, fcntl.LOCK_EX)
            except (OSError, IOError):
                pass  # File locking may fail, continue anyway
    
    def _unlock_file(self, file_handle):
        """Unlock file"""
        if self.is_windows:
            try:
                msvcrt.locking(file_handle.fileno(), msvcrt.LK_UNLCK, 1)
            except (OSError, IOError):
                pass
        else:
            try:
                fcntl.flock(file_handle, fcntl.LOCK_UN)
            except (OSError, IOError):
                pass
    
    def read(self, filename: str) -> Dict[str, Any]:
        """Read JSON file safely"""
        file_path = self.data_dir / filename
        
        if not file_path.exists():
            return {}
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                self._lock_file(f)
                data = json.load(f)
                self._unlock_file(f)
                return data
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Error reading JSON file {filename}: {str(e)}", exc_info=True)
            raise ValueError(f"Error reading {filename}: {str(e)}")
    
    def write(self, filename: str, data: Dict[str, Any]) -> bool:
        """Write JSON file atomically"""
        file_path = self.data_dir / filename
        temp_path = file_path.with_suffix('.tmp')
        
        try:
            # Write to temp file first
            with open(temp_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Atomic replace
            if self.is_windows:
                # Windows doesn't support atomic replace, use try-except
                if temp_path.exists():
                    if file_path.exists():
                        file_path.unlink()
                    temp_path.rename(file_path)
            else:
                temp_path.replace(file_path)
            
            return True
        except (IOError, OSError) as e:
            # Clean up temp file on error
            if temp_path.exists():
                temp_path.unlink()
            logger.error(f"Error writing JSON file {filename}: {str(e)}", exc_info=True)
            raise ValueError(f"Error writing {filename}: {str(e)}")
    
    def read_list(self, filename: str) -> List[Dict[str, Any]]:
        """Read JSON file as list"""
        data = self.read(filename)
        if isinstance(data, list):
            return data
        return []
    
    def write_list(self, filename: str, data: List[Dict[str, Any]]) -> bool:
        """Write list to JSON file"""
        return self.write(filename, data)
    
    def update_item(self, filename: str, item_id: str, updates: Dict[str, Any]) -> bool:
        """Update a specific item in a list-based JSON file"""
        items = self.read_list(filename)
        
        for i, item in enumerate(items):
            if item.get('id') == item_id:
                items[i].update(updates)
                return self.write_list(filename, items)
        
        return False
    
    def delete_item(self, filename: str, item_id: str) -> bool:
        """Delete a specific item from a list-based JSON file"""
        items = self.read_list(filename)
        items = [item for item in items if item.get('id') != item_id]
        return self.write_list(filename, items)
    
    def add_item(self, filename: str, item: Dict[str, Any]) -> bool:
        """Add item to a list-based JSON file"""
        items = self.read_list(filename)
        items.append(item)
        return self.write_list(filename, items)

