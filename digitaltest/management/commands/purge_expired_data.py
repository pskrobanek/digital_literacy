from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils.timezone import now
from django.conf import settings

from digitaltest.models import User, StaffAccessLog

ACCESS_LOG_RETENTION_DAYS = 90


class Command(BaseCommand):
    help = 'Delete patient records older than GDPR_DATA_RETENTION_DAYS and prune old access logs.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Report what would be deleted without deleting.')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        retention_days = getattr(settings, 'GDPR_DATA_RETENTION_DAYS', 730)

        patient_cutoff = now() - timedelta(days=retention_days)
        expired_patients = User.objects.filter(date_registered__lt=patient_cutoff)
        patient_count = expired_patients.count()

        log_cutoff = now() - timedelta(days=ACCESS_LOG_RETENTION_DAYS)
        expired_logs = StaffAccessLog.objects.filter(accessed_at__lt=log_cutoff)
        log_count = expired_logs.count()

        if dry_run:
            self.stdout.write(f'[DRY RUN] Would delete {patient_count} patient(s) registered before {patient_cutoff.date()}.')
            self.stdout.write(f'[DRY RUN] Would delete {log_count} access log(s) older than {log_cutoff.date()}.')
        else:
            expired_patients.delete()
            expired_logs.delete()
            self.stdout.write(self.style.SUCCESS(f'Deleted {patient_count} expired patient record(s).'))
            self.stdout.write(self.style.SUCCESS(f'Deleted {log_count} old access log(s).'))
