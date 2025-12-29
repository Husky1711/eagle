"""
File upload and management utilities
"""
import os
import io
import uuid
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image
import shutil


class FileHandler:
    """Handle file uploads, validation, and storage"""
    
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    def __init__(self, uploads_dir: Path):
        self.uploads_dir = Path(uploads_dir)
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
    
    def validate_file(self, filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
        """Validate uploaded file"""
        # Check extension
        ext = Path(filename).suffix.lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return False, f"File type not allowed. Allowed: {', '.join(self.ALLOWED_EXTENSIONS)}"
        
        # Check size
        if file_size > self.MAX_FILE_SIZE:
            return False, f"File too large. Max size: {self.MAX_FILE_SIZE / 1024 / 1024}MB"
        
        return True, None
    
    def save_file(self, file_content: bytes, original_filename: str) -> Tuple[str, str]:
        """
        Save uploaded file and return (filename, file_path)
        """
        ext = Path(original_filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = self.uploads_dir / unique_filename
        
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        return unique_filename, str(file_path.relative_to(self.uploads_dir.parent))
    
    def save_image(self, file_content: bytes, original_filename: str, 
                   max_size: Optional[Tuple[int, int]] = None) -> Tuple[str, str]:
        """
        Save image with optional resizing
        Returns (filename, relative_path)
        """
        ext = Path(original_filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = self.uploads_dir / unique_filename
        
        # Open and optionally resize image
        image = Image.open(io.BytesIO(file_content))
        
        if max_size:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save image
        if ext == '.png':
            image.save(file_path, 'PNG')
        elif ext in {'.jpg', '.jpeg'}:
            image.save(file_path, 'JPEG', quality=85)
        else:
            image.save(file_path)
        
        return unique_filename, str(file_path.relative_to(self.uploads_dir.parent))
    
    def delete_file(self, filename: str) -> bool:
        """Delete file by filename"""
        file_path = self.uploads_dir / filename
        if file_path.exists():
            file_path.unlink()
            return True
        return False
    
    def file_exists(self, filename: str) -> bool:
        """Check if file exists"""
        return (self.uploads_dir / filename).exists()
    
    def get_file_path(self, filename: str) -> Optional[Path]:
        """Get full path to file"""
        file_path = self.uploads_dir / filename
        if file_path.exists():
            return file_path
        return None

