from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Deletes user accounts that have been inactive for 30 days'

    def handle(self, *args, **options):
        count = User.cleanup_inactive_users()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {count} inactive user accounts')
        ) 