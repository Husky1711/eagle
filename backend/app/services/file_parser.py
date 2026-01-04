"""
File parser service for Excel and CSV import
"""
import csv
import uuid
from pathlib import Path
from typing import Dict, List, Any, Optional
from fastapi import UploadFile, HTTPException, status
from app.config import settings
from app.utils.logger import logger

try:
    import openpyxl
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False

try:
    import xlrd
    XLRD_AVAILABLE = True
except ImportError:
    XLRD_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


class FileParser:
    """Parse Excel and CSV files for pricing import"""
    
    SUPPORTED_EXCEL_EXTENSIONS = {'.xlsx', '.xls'}
    SUPPORTED_CSV_EXTENSIONS = {'.csv'}
    SUPPORTED_EXTENSIONS = SUPPORTED_EXCEL_EXTENSIONS | SUPPORTED_CSV_EXTENSIONS
    
    def __init__(self):
        self.temp_dir = settings.TEMP_DIR
        self.max_file_size = settings.MAX_IMPORT_FILE_SIZE
        self.sample_rows_count = settings.IMPORT_SAMPLE_ROWS
    
    def validate_file(self, file: UploadFile) -> None:
        """
        Validate uploaded file
        
        Args:
            file: Uploaded file
            
        Raises:
            HTTPException: If file is invalid
        """
        # Check file extension
        file_ext = Path(file.filename).suffix.lower() if file.filename else ''
        if file_ext not in self.SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file format. Supported formats: {', '.join(self.SUPPORTED_EXTENSIONS)}"
            )
        
        # Check file size (if available)
        if hasattr(file, 'size') and file.size:
            if file.size > self.max_file_size:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File too large. Maximum size: {self.max_file_size / 1024 / 1024}MB"
                )
    
    async def save_temp_file(self, file: UploadFile) -> Path:
        """
        Save uploaded file temporarily
        
        Args:
            file: Uploaded file
            
        Returns:
            Path: Path to saved file
        """
        file_id = str(uuid.uuid4())
        file_ext = Path(file.filename).suffix.lower() if file.filename else '.tmp'
        temp_file_path = self.temp_dir / f"{file_id}{file_ext}"
        
        # Read file content
        content = await file.read()
        
        # Check size after reading
        if len(content) > self.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {self.max_file_size / 1024 / 1024}MB"
            )
        
        # Write to temp file
        with open(temp_file_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"Temporary file saved: {temp_file_path}")
        return temp_file_path
    
    def parse_excel(self, file_path: Path) -> Dict[str, Any]:
        """
        Parse Excel file (.xlsx or .xls)
        
        Args:
            file_path: Path to Excel file
            
        Returns:
            Dict with columns, rows, and metadata
        """
        file_ext = file_path.suffix.lower()
        
        if file_ext == '.xlsx':
            if not OPENPYXL_AVAILABLE:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Excel support not available. Please install openpyxl."
                )
            return self._parse_xlsx(file_path)
        elif file_ext == '.xls':
            if not XLRD_AVAILABLE:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Legacy Excel support not available. Please install xlrd."
                )
            return self._parse_xls(file_path)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported Excel format: {file_ext}"
            )
    
    def _parse_xlsx(self, file_path: Path) -> Dict[str, Any]:
        """Parse .xlsx file using openpyxl"""
        try:
            workbook = openpyxl.load_workbook(file_path, data_only=True)
            sheet = workbook.active
            
            # Read all rows
            rows = []
            for row in sheet.iter_rows(values_only=True):
                # Skip completely empty rows
                if not any(cell is not None and str(cell).strip() for cell in row):
                    continue
                rows.append([cell if cell is not None else '' for cell in row])
            
            if not rows:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Excel file is empty or contains no data"
                )
            
            # First row is headers
            headers = [str(cell).strip() if cell else f"Column_{i+1}" for i, cell in enumerate(rows[0])]
            data_rows = rows[1:]
            
            # Convert to list of dicts
            data = []
            for row in data_rows:
                row_dict = {}
                for i, header in enumerate(headers):
                    value = row[i] if i < len(row) else ''
                    # Convert to string, handle None
                    row_dict[header] = str(value).strip() if value is not None and value != '' else ''
                data.append(row_dict)
            
            return {
                "columns": headers,
                "rows": data,
                "total_rows": len(data)
            }
        except Exception as e:
            logger.error(f"Error parsing XLSX file: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error parsing Excel file: {str(e)}"
            )
    
    def _parse_xls(self, file_path: Path) -> Dict[str, Any]:
        """Parse .xls file using xlrd"""
        try:
            workbook = xlrd.open_workbook(file_path)
            sheet = workbook.sheet_by_index(0)
            
            # Read all rows
            rows = []
            for row_idx in range(sheet.nrows):
                row = []
                for col_idx in range(sheet.ncols):
                    cell = sheet.cell_value(row_idx, col_idx)
                    row.append(cell)
                # Skip completely empty rows
                if any(cell and str(cell).strip() for cell in row):
                    rows.append(row)
            
            if not rows:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Excel file is empty or contains no data"
                )
            
            # First row is headers
            headers = [str(cell).strip() if cell else f"Column_{i+1}" for i, cell in enumerate(rows[0])]
            data_rows = rows[1:]
            
            # Convert to list of dicts
            data = []
            for row in data_rows:
                row_dict = {}
                for i, header in enumerate(headers):
                    value = row[i] if i < len(row) else ''
                    row_dict[header] = str(value).strip() if value else ''
                data.append(row_dict)
            
            return {
                "columns": headers,
                "rows": data,
                "total_rows": len(data)
            }
        except Exception as e:
            logger.error(f"Error parsing XLS file: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error parsing Excel file: {str(e)}"
            )
    
    def parse_csv(self, file_path: Path) -> Dict[str, Any]:
        """
        Parse CSV file
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            Dict with columns, rows, and metadata
        """
        try:
            data = []
            with open(file_path, 'r', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
                # Try to detect delimiter
                sample = f.read(1024)
                f.seek(0)
                sniffer = csv.Sniffer()
                delimiter = sniffer.sniff(sample).delimiter
                
                reader = csv.DictReader(f, delimiter=delimiter)
                headers = reader.fieldnames or []
                
                if not headers:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="CSV file has no headers"
                    )
                
                for row in reader:
                    # Clean up values
                    cleaned_row = {}
                    for header in headers:
                        value = row.get(header, '')
                        cleaned_row[header] = str(value).strip() if value else ''
                    data.append(cleaned_row)
            
            if not data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CSV file is empty or contains no data"
                )
            
            return {
                "columns": list(headers),
                "rows": data,
                "total_rows": len(data)
            }
        except Exception as e:
            logger.error(f"Error parsing CSV file: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error parsing CSV file: {str(e)}"
            )
    
    async def parse_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        Parse uploaded file (Excel or CSV)
        
        Args:
            file: Uploaded file
            
        Returns:
            Dict with file_id, columns, sample_rows, and total_rows
        """
        # Validate file
        self.validate_file(file)
        
        # Save temporarily
        temp_file_path = await self.save_temp_file(file)
        file_id = temp_file_path.stem  # UUID without extension
        
        try:
            # Parse based on extension
            file_ext = temp_file_path.suffix.lower()
            
            if file_ext in self.SUPPORTED_EXCEL_EXTENSIONS:
                parsed_data = self.parse_excel(temp_file_path)
            elif file_ext in self.SUPPORTED_CSV_EXTENSIONS:
                parsed_data = self.parse_csv(temp_file_path)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported file format: {file_ext}"
                )
            
            # Get sample rows
            sample_rows = parsed_data["rows"][:self.sample_rows_count]
            
            return {
                "file_id": file_id,
                "columns": parsed_data["columns"],
                "sample_rows": sample_rows,
                "total_rows": parsed_data["total_rows"],
                "file_path": str(temp_file_path)  # Store for later use
            }
        except HTTPException:
            # Clean up on error
            if temp_file_path.exists():
                temp_file_path.unlink()
            raise
        except Exception as e:
            # Clean up on error
            if temp_file_path.exists():
                temp_file_path.unlink()
            logger.error(f"Unexpected error parsing file: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing file: {str(e)}"
            )
    
    def get_file_data(self, file_id: str) -> Dict[str, Any]:
        """
        Retrieve parsed file data by file_id
        
        Args:
            file_id: File ID (UUID)
            
        Returns:
            Dict with columns and rows
        """
        # Find file in temp directory
        temp_files = list(self.temp_dir.glob(f"{file_id}.*"))
        if not temp_files:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found or expired"
            )
        
        file_path = temp_files[0]
        file_ext = file_path.suffix.lower()
        
        if file_ext in self.SUPPORTED_EXCEL_EXTENSIONS:
            return self.parse_excel(file_path)
        elif file_ext in self.SUPPORTED_CSV_EXTENSIONS:
            return self.parse_csv(file_path)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format: {file_ext}"
            )
    
    def cleanup_file(self, file_id: str) -> None:
        """
        Clean up temporary file
        
        Args:
            file_id: File ID (UUID)
        """
        temp_files = list(self.temp_dir.glob(f"{file_id}.*"))
        for temp_file in temp_files:
            try:
                temp_file.unlink()
                logger.info(f"Cleaned up temporary file: {temp_file}")
            except Exception as e:
                logger.warning(f"Failed to cleanup file {temp_file}: {str(e)}")


# Global instance
file_parser = FileParser()

