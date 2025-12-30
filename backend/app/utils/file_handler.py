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

# Register HEIC/HEIF support if pillow-heif is available
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
    HEIC_SUPPORT = True
except ImportError:
    HEIC_SUPPORT = False


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
        Converts HEIC/HEIF to JPEG automatically
        """
        ext = Path(original_filename).suffix.lower()
        
        # Check if file is HEIC/HEIF by magic bytes
        is_heic = False
        if len(file_content) >= 12:
            # HEIC files start with ftyp box
            magic = file_content[4:12]
            if magic == b'ftypheic' or magic == b'ftypmif1' or magic == b'ftypmsf1':
                is_heic = True
        
        # If HEIC, convert to JPEG
        if is_heic:
            if not HEIC_SUPPORT:
                # If pillow-heif is not available, reject HEIC files
                raise ValueError("HEIC/HEIF format is not supported. Please convert to JPEG or PNG before uploading.")
            
            try:
                # Use pillow-heif to open HEIC files
                image = Image.open(io.BytesIO(file_content))
                # Convert to RGB if necessary (HEIC might be RGBA)
                if image.mode in ('RGBA', 'LA', 'P'):
                    # Create white background
                    rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                    if image.mode == 'P':
                        image = image.convert('RGBA')
                    rgb_image.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                    image = rgb_image
                elif image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Save as JPEG
                unique_filename = f"{uuid.uuid4()}.jpg"
                file_path = self.uploads_dir / unique_filename
                image.save(file_path, 'JPEG', quality=90)
                return unique_filename, str(file_path.relative_to(self.uploads_dir.parent))
            except Exception as e:
                # If conversion fails, fall back to original save
                # But change extension to .heic so it's clear
                unique_filename = f"{uuid.uuid4()}.heic"
                file_path = self.uploads_dir / unique_filename
                with open(file_path, 'wb') as f:
                    f.write(file_content)
                return unique_filename, str(file_path.relative_to(self.uploads_dir.parent))
        
        # Normal file save
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
    
    def save_profile_image(self, file_content: bytes, original_filename: str, username: str) -> Tuple[str, str]:
        """
        Save profile image with validation and optional resizing
        Returns (filename, relative_path)
        """
        ext = Path(original_filename).suffix.lower()
        
        # Validate extension
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        if ext not in allowed_extensions:
            raise ValueError(f"Invalid image format. Allowed: {', '.join(allowed_extensions)}")
        
        # Validate file size (2MB max)
        max_size = 2 * 1024 * 1024  # 2MB
        if len(file_content) > max_size:
            raise ValueError(f"Image too large. Maximum size: {max_size / 1024 / 1024}MB")
        
        # Open and validate image
        try:
            image = Image.open(io.BytesIO(file_content))
            image.verify()  # Verify it's a valid image
        except Exception as e:
            raise ValueError(f"Invalid image file: {str(e)}")
        
        # Reopen image (verify() closes it)
        image = Image.open(io.BytesIO(file_content))
        
        # Resize if too large (max 500x500px)
        max_dimension = 500
        if image.width > max_dimension or image.height > max_dimension:
            image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        
        # Convert to RGB if necessary (for JPEG)
        if image.mode in ('RGBA', 'LA', 'P'):
            rgb_image = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            rgb_image.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = rgb_image
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Generate unique filename: {username}-{uuid}.jpg
        unique_filename = f"{username}-{uuid.uuid4()}.jpg"
        
        # Save as JPEG (always save profile images as JPEG for consistency)
        from app.config import settings
        file_path = settings.PROFILES_DIR / unique_filename
        image.save(file_path, 'JPEG', quality=90)
        
        # Return relative path from uploads directory
        relative_path = f"profiles/{unique_filename}"
        return unique_filename, relative_path

