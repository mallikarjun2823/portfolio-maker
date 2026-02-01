from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from portfolioMaker.portfolio import models
from django.utils import timezone
from datetime import timedelta
import random

class Command(BaseCommand):
    help = 'Seed database with test users, portfolios, projects, skills, education, social links, documents and versions.'

    def handle(self, *args, **options):
        """Create 5 users each with a portfolio and related objects.
        Idempotent: re-running won't create duplicates for same username/title types.
        """
        created_count = 0

        for idx in range(1, 6):
            username = f'seeduser{idx}'
            email = f'{username}@example.test'
            password = 'SeedPass123!'

            user, user_created = User.objects.get_or_create(username=username, defaults={'email': email})
            if user_created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created user: {username}'))
                created_count += 1
            else:
                self.stdout.write(self.style.WARNING(f'User already exists: {username}'))

            # Ensure UserProfile exists
            profile, prof_created = models.UserProfile.objects.get_or_create(user=user)
            if prof_created:
                self.stdout.write(self.style.SUCCESS(f'Created profile for {username}'))

            # Portfolio
            title = f'{username} Portfolio'
            portfolio, port_created = models.Portfolio.objects.get_or_create(
                user=user,
                defaults={
                    'title': title,
                    'summary': f'Sample portfolio for {username}',
                    'status': models.PortfolioStatus.PUBLISHED if idx % 2 == 1 else models.PortfolioStatus.DRAFT,
                }
            )
            if port_created:
                self.stdout.write(self.style.SUCCESS(f'Created portfolio for {username}'))
            else:
                self.stdout.write(self.style.WARNING(f'Portfolio already exists for {username}'))

            # Projects (3)
            for i in range(1, 4):
                proj_title = f'{username} Project {i}'
                project, proj_created = models.Project.objects.get_or_create(
                    portfolio=portfolio,
                    title=proj_title,
                    defaults={
                        'description': f'Description for {proj_title}',
                        'tech_stack': 'Django, DRF, PostgreSQL',
                        'project_url': f'https://example.com/{username}/project{i}',
                        'status': models.ItemStatus.PUBLISHED if i != 3 else models.ItemStatus.DRAFT
                    }
                )
                if proj_created:
                    self.stdout.write(self.style.SUCCESS(f'  Created project: {proj_title}'))

            # Skills (3)
            proficiency = [models.ProficiencyLevel.BEGINNER, models.ProficiencyLevel.INTERMEDIATE, models.ProficiencyLevel.ADVANCED]
            for i in range(3):
                skill_name = f'{username} Skill {i+1}'
                skill, skill_created = models.Skill.objects.get_or_create(
                    portfolio=portfolio,
                    name=skill_name,
                    defaults={
                        'proficiency_level': proficiency[i % len(proficiency)],
                        'years_of_experience': i + 1
                    }
                )
                if skill_created:
                    # attach a small certification file for the first skill
                    if i == 0:
                        content = ContentFile(f'Certificate for {skill_name}'.encode('utf-8'))
                        content_name = f'certificate_{username}_{i+1}.txt'
                        skill.skill_certification.save(content_name, content, save=True)
                    self.stdout.write(self.style.SUCCESS(f'  Created skill: {skill_name}'))

            # Education (2)
            edu_data = [
                ('Example University', 'BSc Computer Science', 2014, 2018),
                ('Example Institute', 'MSc Computer Science', 2019, 2021)
            ]
            for institution, degree, start_year, end_year in edu_data:
                edu, edu_created = models.Education.objects.get_or_create(
                    portfolio=portfolio,
                    institution=institution,
                    degree=degree,
                    defaults={
                        'start_year': start_year,
                        'end_year': end_year
                    }
                )
                if edu_created:
                    self.stdout.write(self.style.SUCCESS(f'  Created education: {institution} - {degree}'))

            # Social Links (2)
            socials = [
                ('GitHub', f'https://github.com/{username}'),
                ('LinkedIn', f'https://linkedin.com/in/{username}')
            ]
            for platform, url in socials:
                sl, sl_created = models.SocialLink.objects.get_or_create(
                    portfolio=portfolio,
                    platform=platform,
                    defaults={'url': url}
                )
                if sl_created:
                    self.stdout.write(self.style.SUCCESS(f'  Created social link: {platform}'))

            # Documents: resume + certificate
            # Resume: only one per portfolio
            if not models.Document.objects.filter(portfolio=portfolio, doc_type=models.Document.DocumentType.RESUME).exists():
                resume_content = ContentFile(f'Resume for {username}\nExperience: 3 years'.encode('utf-8'))
                resume = models.Document(portfolio=portfolio, doc_type=models.Document.DocumentType.RESUME, status=models.ItemStatus.DRAFT)
                resume.file.save(f'resume_{username}.txt', resume_content, save=True)
                self.stdout.write(self.style.SUCCESS(f'  Created resume for {username}'))

            # Certificate doc
            cert_content = ContentFile(f'Certificate for {username}'.encode('utf-8'))
            cert = models.Document(portfolio=portfolio, doc_type=models.Document.DocumentType.CERTIFICATE, status=models.ItemStatus.DRAFT)
            cert.file.save(f'certificate_{username}.txt', cert_content, save=True)
            self.stdout.write(self.style.SUCCESS(f'  Created certificate for {username}'))

            # Create an initial version snapshot
            if not models.PortfolioVersion.objects.filter(portfolio=portfolio, version_number=1).exists():
                models.PortfolioVersion.objects.create(
                    portfolio=portfolio,
                    version_number=1,
                    title=portfolio.title,
                    summary=portfolio.summary,
                    status=portfolio.status,
                    created_by=user,
                    change_note='Initial seed version',
                    is_draft=False
                )
                self.stdout.write(self.style.SUCCESS(f'  Created initial version for {username}'))

            # Create profile views for analytics testing
            # Mix of authenticated viewers and anonymous IP-based views
            other_users = list(User.objects.exclude(id=user.id))
            num_views = idx * 3  # vary per user
            for v in range(1, num_views + 1):
                if other_users and v % 3 != 0:
                    viewer = random.choice(other_users)
                    ip = None
                else:
                    viewer = None
                    ip = f"192.0.2.{(idx * 10 + v) % 254}"
                viewed_at = timezone.now() - timedelta(days=random.randint(0, 14), hours=random.randint(0,23))
                models.ProfileView.objects.create(
                    viewer=viewer,
                    portfolio=portfolio,
                    viewed_at=viewed_at,
                    ip_address=ip
                )
            self.stdout.write(self.style.SUCCESS(f'  Created {num_views} profile views for {username}'))

        self.stdout.write(self.style.SUCCESS(f'Seeding complete. Created/verified users: {created_count}'))
