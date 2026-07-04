"""
File system utility functions.

Provides reusable helpers for scanning directories,
reading text files, and validating file metadata.
"""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".txt"}


def scan_directory(directory: Path, extension: str = ".txt") -> list[Path]:
    """
    Recursively scan a directory for files with the given extension.

    Args:
        directory: Root directory to scan.
        extension: File extension to filter by (default: .txt).

    Returns:
        Sorted list of matching file paths.

    Raises:
        FileNotFoundError: If the directory does not exist.
    """
    if not directory.exists():
        raise FileNotFoundError(f"Directory not found: {directory}")
    if not directory.is_dir():
        raise NotADirectoryError(f"Path is not a directory: {directory}")

    files = sorted(directory.rglob(f"*{extension}"))
    logger.info("Found %d files with extension '%s' in %s", len(files), extension, directory)
    return files


def read_text_file(file_path: Path) -> str | None:
    """
    Safely read a UTF-8 text file and return its content.

    Args:
        file_path: Path to the text file.

    Returns:
        File content as a string, or None if reading fails.
    """
    try:
        return file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        logger.warning("Unicode decode error in %s, trying latin-1 fallback", file_path)
        try:
            return file_path.read_text(encoding="latin-1")
        except Exception as e:
            logger.error("Failed to read %s with latin-1 fallback: %s", file_path, e)
            return None
    except PermissionError:
        logger.error("Permission denied: %s", file_path)
        return None
    except OSError as e:
        logger.error("OS error reading %s: %s", file_path, e)
        return None


def get_file_size(file_path: Path) -> int:
    """
    Get the size of a file in bytes.

    Args:
        file_path: Path to the file.

    Returns:
        File size in bytes, or 0 if inaccessible.
    """
    try:
        return file_path.stat().st_size
    except OSError as e:
        logger.error("Failed to get file size for %s: %s", file_path, e)
        return 0


def is_valid_file(file_path: Path) -> bool:
    """
    Check whether a file is valid for loading.

    A valid file must:
    - Have a supported extension (.txt)
    - Exist on disk
    - Be non-empty

    Args:
        file_path: Path to the file to validate.

    Returns:
        True if the file is valid, False otherwise.
    """
    extension_mismatch = file_path.suffix.lower() not in SUPPORTED_EXTENSIONS
    if extension_mismatch:
        logger.debug("Skipping unsupported file (extension not in %s): %s", SUPPORTED_EXTENSIONS, file_path.name)
        return False

    if get_file_size(file_path) == 0:
        logger.warning("Skipping empty file: %s", file_path)
        return False

    return True


def extract_partition(file_path: Path, contracts_root: Path) -> str | None:
    """
    Extract the dataset partition name from a file path.

    For CUAD, partitions are directory names like Part_I, Part_II, Part_III
    that appear in the path between the contracts root and the file.

    Args:
        file_path: Absolute path to the contract file.
        contracts_root: Absolute path to the contracts root directory.

    Returns:
        Partition name (e.g. "Part_I") or None if not determined.
    """
    try:
        relative = file_path.relative_to(contracts_root)
        parts = relative.parts
        if parts and parts[0].startswith("Part_"):
            return parts[0]
        return None
    except ValueError:
        logger.warning("File %s is not under contracts root %s", file_path, contracts_root)
        return None
