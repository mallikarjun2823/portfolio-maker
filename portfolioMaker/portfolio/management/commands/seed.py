from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from portfolioMaker.portfolio.models import Portfolio, Project

class Command(BaseCommand):
    help = 'Seed database with test users, portfolios, and projects.'

    def handle(self, *args, **options):
        # Create test user
        user, created = User.objects.get_or_create(username='testuser', defaults={'email': 'test@example.com'})
        if created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created test user'))
        else:
            self.stdout.write(self.style.WARNING('Test user already exists'))

        # Create portfolio for user
        portfolio, created = Portfolio.objects.get_or_create(user=user, defaults={
            'title': 'Test Portfolio',
            'summary': 'A test portfolio',
            'is_public': True,
            'is_published': True
        })
        if created:
            self.stdout.write(self.style.SUCCESS('Created test portfolio'))
        else:
            self.stdout.write(self.style.WARNING('Test portfolio already exists'))

        # Create projects
        for i in range(1, 4):
            project, created = Project.objects.get_or_create(
                portfolio=portfolio,
                title=f'Test Project {i}',
                defaults={
                    'description': f'This is test project {i}',
                    'tech_stack': 'Django, DRF',
                    'project_url': f'https://example.com/project{i}',
                    'is_published': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created project {i}'))
            else:
                self.stdout.write(self.style.WARNING(f'Project {i} already exists'))
