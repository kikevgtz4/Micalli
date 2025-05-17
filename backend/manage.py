#!/usr/bin/env python
import os
import sys

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unihousing_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Check if we're trying to run the server
    if len(sys.argv) >= 2 and sys.argv[1] == 'runserver':
        # If no explicit binding is provided, add IPv6 binding
        if len(sys.argv) == 2:
            sys.argv.append('[::]:8000')
        elif len(sys.argv) == 3 and ':' not in sys.argv[2]:
            # If only port is specified, use IPv6 binding with that port
            port = sys.argv[2]
            sys.argv[2] = f'[::]:{port}'
    
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()