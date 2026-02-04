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
        """Create 10 users each with a portfolio and related objects.
        Idempotent: re-running won't create duplicates for same username/title types.
        Each portfolio will include 5 projects, 5 skills and 3 education entries
        with varied statuses and edge-cases for UI/testing.
        """
        created_count = 0

        for idx in range(1, 11):
            username = f'seeduser{idx}'
            email = f'{username}@example.test'
            password = 'Password123!'

            user, user_created = User.objects.get_or_create(username=username, defaults={'email': email})
            if user_created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created user: {username}'))
            else:
                self.stdout.write(self.style.WARNING(f'User already exists: {username}'))

            # For testing/seed idempotency: always set/reset the password to a known value
            # so the frontend can log in with the seeded accounts.
            user.set_password(password)
            user.email = email
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Set password for {username}'))

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

            # Projects (5) - include some missing URLs and mixed statuses
            for i in range(1, 6):
                proj_title = f'{username} Project {i}'
                # Leave URL empty for every 3rd project to simulate missing data
                project_url = '' if i % 3 == 0 else f'https://example.com/{username}/project{i}'
                status = models.ItemStatus.PUBLISHED if i % 2 == 1 else models.ItemStatus.DRAFT
                project, proj_created = models.Project.objects.get_or_create(
                    portfolio=portfolio,
                    title=proj_title,
                    defaults={
                        'description': f'Description for {proj_title}',
                        'tech_stack': 'Django, DRF, PostgreSQL' if i % 2 == 1 else 'React, Vite, Tailwind',
                        'project_url': project_url,
                        'status': status
                    }
                )
                if proj_created:
                    self.stdout.write(self.style.SUCCESS(f'  Created project: {proj_title}'))

            # Skills (5) - varied proficiency levels, some with certifications
            prof_choices = [models.ProficiencyLevel.BEGINNER, models.ProficiencyLevel.INTERMEDIATE, models.ProficiencyLevel.ADVANCED, models.ProficiencyLevel.EXPERT]
            for i in range(5):
                skill_name = f'{username} Skill {i+1}'
                proficiency_choice = prof_choices[i % len(prof_choices)]
                years = i + (0 if i < 2 else 2)
                skill, skill_created = models.Skill.objects.get_or_create(
                    portfolio=portfolio,
                    name=skill_name,
                    defaults={
                        'proficiency_level': proficiency_choice,
                        'years_of_experience': years,
                        'status': models.ItemStatus.PUBLISHED if i % 2 == 0 else models.ItemStatus.DRAFT
                    }
                )
                if skill_created:
                    # Attach certification file for some skills to test file handling
                    if (i == 0) or (idx % 2 == 0 and i == 2):
                        content = ContentFile(f'Certificate for {skill_name}'.encode('utf-8'))
                        content_name = f'certificate_{username}_{i+1}.txt'
                        skill.skill_certification.save(content_name, content, save=True)
                    self.stdout.write(self.style.SUCCESS(f'  Created skill: {skill_name}'))

            # Education (3) - include an ongoing program (no end_year)
            edu_data = [
                ('Example University', 'BSc Computer Science', 2010, 2014),
                ('Example Institute', 'MSc Computer Science', 2016, 2018),
                ('Open Academy', 'Professional Certificate in AI', 2024, None)  # ongoing / recent
            ]
            for institution, degree, start_year, end_year in edu_data:
                defaults = {'start_year': start_year}
                if end_year is not None:
                    defaults['end_year'] = end_year
                edu, edu_created = models.Education.objects.get_or_create(
                    portfolio=portfolio,
                    institution=institution,
                    degree=degree,
                    defaults=defaults
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

            # Documents: create a resume for most users and a certificate for all
            # Skip resume for every 4th user to test missing-doc cases
            if idx % 4 != 0 and not models.Document.objects.filter(portfolio=portfolio, doc_type=models.Document.DocumentType.RESUME).exists():
                resume_content = ContentFile(f'Resume for {username}\nExperience: {2 + idx % 5} years'.encode('utf-8'))
                resume = models.Document(portfolio=portfolio, doc_type=models.Document.DocumentType.RESUME, status=models.ItemStatus.PUBLISHED if idx % 2 == 0 else models.ItemStatus.DRAFT)
                resume.file.save(f'resume_{username}.txt', resume_content, save=True)
                self.stdout.write(self.style.SUCCESS(f'  Created resume for {username}'))

            # Certificate doc (always create)
            cert_content = ContentFile(f'Certificate for {username}'.encode('utf-8'))
            cert = models.Document(portfolio=portfolio, doc_type=models.Document.DocumentType.CERTIFICATE, status=models.ItemStatus.DRAFT)
            cert.file.save(f'certificate_{username}.txt', cert_content, save=True)
            self.stdout.write(self.style.SUCCESS(f'  Created certificate for {username}'))

            # Create an initial version snapshot and an additional draft version for some
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
            # Add a draft second version occasionally
            if idx % 3 == 0 and not models.PortfolioVersion.objects.filter(portfolio=portfolio, version_number=2).exists():
                models.PortfolioVersion.objects.create(
                    portfolio=portfolio,
                    version_number=2,
                    title=portfolio.title + ' (WIP)',
                    summary=portfolio.summary,
                    status=models.PortfolioStatus.REVIEW,
                    created_by=user,
                    change_note='Work-in-progress seed version',
                    is_draft=True
                )
                self.stdout.write(self.style.SUCCESS(f'  Created draft version for {username}'))

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
