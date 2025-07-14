# backend/messaging/management/commands/cleanup_messages.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from messaging.models import Message, Conversation
from django.db import transaction
import logging

logger = logging.getLogger('messaging.cleanup')


class Command(BaseCommand):
    help = 'Clean up old messages and conversations'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--archive-days',
            type=int,
            default=365,
            help='Archive conversations older than this many days'
        )
        parser.add_argument(
            '--delete-days',
            type=int,
            default=730,  # 2 years
            help='Delete messages older than this many days (must be > archive-days)'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='Process records in batches of this size'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without making changes'
        )
    
    def handle(self, *args, **options):
        archive_days = options['archive_days']
        delete_days = options['delete_days']
        batch_size = options['batch_size']
        dry_run = options['dry_run']
        
        if delete_days <= archive_days:
            self.stdout.write(self.style.ERROR('delete-days must be greater than archive-days'))
            return
        
        archive_cutoff = timezone.now() - timedelta(days=archive_days)
        delete_cutoff = timezone.now() - timedelta(days=delete_days)
        
        self.stdout.write(f"Archive cutoff: {archive_cutoff}")
        self.stdout.write(f"Delete cutoff: {delete_cutoff}")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No changes will be made"))
        
        # Archive old conversations
        self._archive_conversations(archive_cutoff, batch_size, dry_run)
        
        # Clean up old delivered messages
        self._cleanup_old_messages(delete_cutoff, batch_size, dry_run)
        
        # Clean up orphaned data
        self._cleanup_orphaned_data(dry_run)
        
        self.stdout.write(self.style.SUCCESS("Cleanup completed successfully"))
    
    def _archive_conversations(self, cutoff_date, batch_size, dry_run):
        """Archive old active conversations"""
        total_count = Conversation.objects.filter(
            updated_at__lt=cutoff_date,
            status='active'
        ).count()
        
        self.stdout.write(f"Found {total_count} conversations to archive")
        
        if not dry_run and total_count > 0:
            with transaction.atomic():
                updated = Conversation.objects.filter(
                    updated_at__lt=cutoff_date,
                    status='active'
                ).update(status='archived')
                
                self.stdout.write(self.style.SUCCESS(f"Archived {updated} conversations"))
                
                logger.info(f"Archived {updated} conversations older than {cutoff_date}")
    
    def _cleanup_old_messages(self, cutoff_date, batch_size, dry_run):
        """Delete very old, read messages"""
        # Only delete messages that are:
        # 1. Older than cutoff date
        # 2. Already read
        # 3. Not flagged or part of flagged conversations
        queryset = Message.objects.filter(
            created_at__lt=cutoff_date,
            read=True,
            conversation__has_flagged_content=False
        ).exclude(
            conversation__status='flagged'
        )
        
        total_count = queryset.count()
        self.stdout.write(f"Found {total_count} old messages eligible for deletion")
        
        if not dry_run and total_count > 0:
            deleted_count = 0
            
            while True:
                # Delete in batches to avoid locking issues
                batch_ids = list(queryset.values_list('id', flat=True)[:batch_size])
                
                if not batch_ids:
                    break
                
                deleted, _ = Message.objects.filter(id__in=batch_ids).delete()
                deleted_count += deleted
                
                self.stdout.write(f"Deleted {deleted_count}/{total_count} messages...")
            
            self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_count} old messages"))
            logger.info(f"Deleted {deleted_count} messages older than {cutoff_date}")
    
    def _cleanup_orphaned_data(self, dry_run):
        """Clean up orphaned data"""
        # Delete conversations with no messages
        empty_conversations = Conversation.objects.annotate(
            message_count=Count('messages')
        ).filter(message_count=0, created_at__lt=timezone.now() - timedelta(days=7))
        
        empty_count = empty_conversations.count()
        
        if empty_count > 0:
            self.stdout.write(f"Found {empty_count} empty conversations")
            
            if not dry_run:
                deleted, _ = empty_conversations.delete()
                self.stdout.write(self.style.SUCCESS(f"Deleted {deleted} empty conversations"))