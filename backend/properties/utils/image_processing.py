# backend/properties/utils/image_processing.py
from PIL import Image
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import InMemoryUploadedFile
from io import BytesIO
import sys

class ImageProcessor:
    """
    Utility class for processing uploaded images while maintaining quality
    """
    
    MAX_WIDTH = 2400  # Maximum width in pixels
    MAX_HEIGHT = 2400  # Maximum height in pixels
    QUALITY = 95  # JPEG quality (1-100)
    
    @staticmethod
    def process_image(image_file, max_size=(2400, 2400), quality=95):
        """
        Process uploaded image to ensure optimal quality and size
        
        Args:
            image_file: Django UploadedFile object
            max_size: Tuple of (max_width, max_height)
            quality: JPEG quality (1-100)
            
        Returns:
            Processed image file
        """
        # Open the image
        img = Image.open(image_file)
        
        # Convert RGBA to RGB if necessary (for JPEG compatibility)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create a white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Get current dimensions
        width, height = img.size
        
        # Only resize if image exceeds maximum dimensions
        if width > max_size[0] or height > max_size[1]:
            # Calculate aspect ratio
            aspect_ratio = width / height
            
            if width > height:
                new_width = min(width, max_size[0])
                new_height = int(new_width / aspect_ratio)
            else:
                new_height = min(height, max_size[1])
                new_width = int(new_height * aspect_ratio)
            
            # Use high-quality resampling
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save to BytesIO with high quality
        output = BytesIO()
        
        # Determine format
        format = 'JPEG'
        content_type = 'image/jpeg'
        
        # Save with optimization
        img.save(
            output, 
            format=format,
            quality=quality,
            optimize=True,
            progressive=True  # Enable progressive JPEG
        )
        
        output.seek(0)
        
        # Create new InMemoryUploadedFile
        return InMemoryUploadedFile(
            output,
            'ImageField',
            f"{image_file.name.split('.')[0]}.jpg",
            content_type,
            sys.getsizeof(output),
            None
        )
    
    @staticmethod
    def create_thumbnail(image_file, size=(400, 400), quality=85):
        """
        Create a thumbnail version of the image
        
        Args:
            image_file: Django UploadedFile object
            size: Tuple of (width, height) for thumbnail
            quality: JPEG quality for thumbnail
            
        Returns:
            Thumbnail image file
        """
        img = Image.open(image_file)
        
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Create thumbnail maintaining aspect ratio
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Save thumbnail
        output = BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)
        
        return ContentFile(output.read())