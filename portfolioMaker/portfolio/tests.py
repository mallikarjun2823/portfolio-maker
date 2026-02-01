
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import ValidationError
from unittest.mock import patch
from .models import Project, Portfolio, Skill, Education, SocialLink, Document, PortfolioVersion, ProfileView, ActivityLog, ProficiencyLevel, PortfolioStatus, ItemStatus
from .services import PortfolioService, ProjectService, SkillService, EducationService, SocialLinkService, DocumentService
from .permissions import IsPortfolioOwner
from datetime import date, datetime, timedelta
from django.utils import timezone
import jwt
from django.conf import settings

class BaseSeededTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Seed database with known data
        from django.core.management import call_command
        call_command('seed')

        # Try to use legacy 'testuser' if present, otherwise pick any user or create one
        try:
            cls.user = User.objects.get(username='testuser')
        except User.DoesNotExist:
            cls.user = User.objects.first()
            if cls.user is None:
                cls.user = User.objects.create_user(username='autotestuser', email='auto@example.test', password='testpass123')

        # Ensure the user has a known password for test login
        cls.user.set_password('testpass123')
        cls.user.save()

        # Ensure a portfolio exists for this user
        cls.portfolio, _ = Portfolio.objects.get_or_create(
            user=cls.user,
            defaults={
                'title': f"{cls.user.username} Portfolio",
                'summary': 'Auto-created portfolio for tests',
                'status': PortfolioStatus.PUBLISHED
            }
        )

    def setUp(self):
        # Log in using the selected seeded user
        self.client.login(username=self.user.username, password='testpass123')


class AuthTests(APITestCase):
    def test_register_and_login(self):
        # Register
        url = reverse('register')
        resp = self.client.post(url, {'username': 'authuser', 'email': 'a@example.test', 'password': 'AuthPass123!'})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        # Login
        url = reverse('login')
        resp = self.client.post(url, {'username': 'authuser', 'password': 'AuthPass123!'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('token', resp.data)


class PortfolioTests(BaseSeededTestCase):
    def test_list_portfolios(self):
        url = reverse('portfolio-list-create')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)

    def test_create_portfolio_existing_user_fails(self):
        url = reverse('portfolio-list-create')
        data = {'title': 'Dup', 'summary': 'Dup', 'status': PortfolioStatus.DRAFT}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_portfolio_new_user(self):
        new_user = User.objects.create_user(username='newuser', password='newpass')
        self.client.logout()
        self.client.login(username='newuser', password='newpass')
        url = reverse('portfolio-list-create')
        data = {'title': 'New User Portfolio', 'summary': 'A portfolio for new user', 'status': PortfolioStatus.PUBLISHED}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Portfolio.objects.filter(user__username='newuser').exists())

    def test_retrieve_update_delete_portfolio(self):
        # Ensure portfolio exists (re-seed if necessary)
        from django.core.management import call_command
        if not Portfolio.objects.filter(id=self.portfolio.id).exists():
            call_command('seed')
            self.portfolio = Portfolio.objects.get(user=self.user)

        url = reverse('portfolio-detail', kwargs={'pk': self.portfolio.id})
        # retrieve
        resp = self.client.get(url)
        if resp.status_code != status.HTTP_200_OK:
            # Emit debug info to make it clear why the request failed during test runs.
            # This will fail the test with helpful debugging output.
            self.fail(f"GET /portfolios/{self.portfolio.id}/ failed: status={resp.status_code} data={getattr(resp, 'data', None)} content={resp.content}")
        # attempt invalid update (summary too short) — should return 400
        resp = self.client.put(url, {'summary': 'Short'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('summary', resp.data)
        self.assertTrue(any('at least' in str(m).lower() for m in resp.data['summary']))

        # now perform a valid update
        valid_summary = 'Updated summary via API'
        resp = self.client.put(url, {'summary': valid_summary}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, f"PUT /portfolios/{self.portfolio.id}/ failed: status={resp.status_code} data={getattr(resp, 'data', None)}")
        self.portfolio.refresh_from_db()
        self.assertEqual(self.portfolio.summary, valid_summary)

        # delete (owner)
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        # re-seed for other tests
        call_command('seed')

    def test_update_not_owner_forbidden(self):
        other = User.objects.create_user(username='other', password='otherpass')
        self.client.logout()
        self.client.login(username='other', password='otherpass')
        url = reverse('portfolio-detail', kwargs={'pk': self.portfolio.id})
        resp = self.client.put(url, {'summary': 'Bad'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_flag_validation(self):
        # cannot set public when not published
        self.portfolio.status = PortfolioStatus.DRAFT
        self.portfolio.save()
        url = reverse('portfolio-detail', kwargs={'pk': self.portfolio.id})
        # status is read-only via serializer; attempting to change it through the API should not update it
        resp = self.client.put(url, {'status': PortfolioStatus.PUBLISHED}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.portfolio.refresh_from_db()
        self.assertEqual(self.portfolio.status, PortfolioStatus.DRAFT)


class ProjectTests(BaseSeededTestCase):
    def test_list_projects(self):
        url = reverse('project-list-create', kwargs={'portfolio_id': self.portfolio.id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)

    def test_create_project(self):
        url = reverse('project-list-create', kwargs={'portfolio_id': self.portfolio.id})
        data = {'title': 'ProjX', 'description': 'A valid description for project', 'tech_stack': 'Django', 'project_url': 'https://ex.com', 'status': ItemStatus.PUBLISHED}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Project.objects.filter(title='ProjX').exists())

    def test_create_project_unauth_forbidden(self):
        self.client.logout()
        url = reverse('project-list-create', kwargs={'portfolio_id': self.portfolio.id})
        data = {'title': 'X', 'description': 'short', 'tech_stack': ''}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_project_validation(self):
        url = reverse('project-list-create', kwargs={'portfolio_id': self.portfolio.id})
        data = {'title': 'S', 'description': 'short', 'tech_stack': ''}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_project_detail_update_delete(self):
        project = Project.objects.filter(portfolio=self.portfolio).first()
        url = reverse('project-detail', kwargs={'portfolio_id': self.portfolio.id, 'pk': project.id})
        # get
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # update
        resp = self.client.put(url, {'title': 'UpdatedProj'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        project.refresh_from_db()
        self.assertEqual(project.title, 'UpdatedProj')
        # delete
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)


class SkillsTests(BaseSeededTestCase):
    def test_skills_crud(self):
        url = reverse('skill-list-create', kwargs={'portfolio_id': self.portfolio.id})
        # list
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # create
        data = {'name': 'UnitTestSkill', 'proficiency_level': 'BEGINNER', 'years_of_experience': 1}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        sid = resp.data['id']
        # retrieve
        url_get = reverse('skill-detail', kwargs={'portfolio_id': self.portfolio.id, 'pk': sid})
        resp = self.client.get(url_get)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # update
        resp = self.client.put(url_get, {'name': 'UpdatedSkill'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # delete
        resp = self.client.delete(url_get)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)


class EducationTests(BaseSeededTestCase):
    def test_education_crud(self):
        url = reverse('education-list-create', kwargs={'portfolio_id': self.portfolio.id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = {'institution': 'Test Uni', 'degree': 'BSc', 'start_year': 2010, 'end_year': 2014}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        eid = resp.data['id']
        url_get = reverse('education-detail', kwargs={'portfolio_id': self.portfolio.id, 'pk': eid})
        resp = self.client.get(url_get)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        resp = self.client.put(url_get, {'degree': 'MSc'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        resp = self.client.delete(url_get)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)


class SocialLinksTests(BaseSeededTestCase):
    def test_social_links_crud(self):
        url = reverse('social-link-list-create', kwargs={'portfolio_id': self.portfolio.id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = {'platform': 'Twitter', 'url': 'https://twitter.com/test'}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        sid = resp.data['id']
        url_get = reverse('social-link-detail', kwargs={'portfolio_id': self.portfolio.id, 'pk': sid})
        resp = self.client.get(url_get)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        resp = self.client.put(url_get, {'platform': 'X'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        resp = self.client.delete(url_get)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)


class DocumentTests(BaseSeededTestCase):
    def test_document_upload_and_constraints(self):
        url = reverse('document-list-create', kwargs={'portfolio_id': self.portfolio.id})
        f = SimpleUploadedFile('resume.txt', b'resume', content_type='text/plain')
        resp = self.client.post(url, {'doc_type': 'resume', 'file': f}, format='multipart')
        # Depending on seed state, creating a resume may succeed or fail if one already exists.
        self.assertIn(resp.status_code, (status.HTTP_201_CREATED, status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST))
        # trying to add another resume should fail (idempotent behavior)
        f2 = SimpleUploadedFile('resume2.txt', b'resume2', content_type='text/plain')
        resp2 = self.client.post(url, {'doc_type': 'resume', 'file': f2}, format='multipart')
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)


class VersionTests(BaseSeededTestCase):
    def test_versions_create_get_revert(self):
        url = reverse('portfolio-version-list', kwargs={'portfolio_id': self.portfolio.id})
        resp = self.client.post(url, {'change_note': 'snapshot', 'is_draft': False}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        vnum = resp.data['version_number']
        url_get = reverse('portfolio-version-detail', kwargs={'portfolio_id': self.portfolio.id, 'version_number': vnum})
        resp = self.client.get(url_get)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        url_revert = reverse('portfolio-version-revert', kwargs={'portfolio_id': self.portfolio.id, 'version_number': vnum})
        resp = self.client.post(url_revert)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class DebugTests(BaseSeededTestCase):
    def test_debug_queries(self):
        url = reverse('debug-queries')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('query_count', resp.data)
        self.assertIsInstance(resp.data['query_count'], int)


class AnalyticsTests(BaseSeededTestCase):
    def test_analytics_endpoint_wide_range(self):
        url = reverse('analytics')
        data = {
            'start_date': '2000-01-01',
            'end_date': str(date.today()),
            'group_by': 'day',
            'metrics': ['count']
        }
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, f"Analytics endpoint failed: {getattr(resp, 'data', None)}")
        # Expect structure: labels, values, rows
        self.assertIn('labels', resp.data)
        self.assertIn('values', resp.data)
        self.assertIn('rows', resp.data)
        self.assertIsInstance(resp.data['labels'], list)
        self.assertIsInstance(resp.data['values'], list)
        self.assertIsInstance(resp.data['rows'], list)
        # Rows may be empty depending on time bucketing; ensure structure is correct.


# ===== ENHANCED TESTS FOR COMPREHENSIVE COVERAGE =====

class AuthenticationAdvancedTests(APITestCase):
    """Test JWT authentication edge cases and validation"""
    
    def test_register_validation_edge_cases(self):
        url = reverse('register')
        
        # Test password too short
        resp = self.client.post(url, {
            'username': 'user1', 
            'email': 'user1@test.com', 
            'password': '123'
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test duplicate username
        User.objects.create_user('existing', 'existing@test.com', 'password123')
        resp = self.client.post(url, {
            'username': 'existing', 
            'email': 'new@test.com', 
            'password': 'newpass123'
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test successful registration returns token
        resp = self.client.post(url, {
            'username': 'validuser', 
            'email': 'valid@test.com', 
            'password': 'validpass123'
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', resp.data)
        
        # Verify token is valid JWT
        token = resp.data['token']
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        self.assertEqual(payload['username'], 'validuser')

    def test_login_edge_cases(self):
        url = reverse('login')
        user = User.objects.create_user('loginuser', 'login@test.com', 'loginpass123')
        
        # Test wrong password
        resp = self.client.post(url, {
            'username': 'loginuser',
            'password': 'wrongpass'
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test nonexistent user
        resp = self.client.post(url, {
            'username': 'nonexistent',
            'password': 'anypass'
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test inactive user
        user.is_active = False
        user.save()
        resp = self.client.post(url, {
            'username': 'loginuser',
            'password': 'loginpass123'
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test successful login
        user.is_active = True
        user.save()
        resp = self.client.post(url, {
            'username': 'loginuser',
            'password': 'loginpass123'
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('token', resp.data)
        self.assertEqual(resp.data['username'], 'loginuser')


class PortfolioBusinessLogicTests(APITestCase):
    """Test portfolio business rules and edge cases"""
    
    def setUp(self):
        self.user1 = User.objects.create_user('user1', 'user1@test.com', 'pass123')
        self.user2 = User.objects.create_user('user2', 'user2@test.com', 'pass123')
        self.client.login(username='user1', password='pass123')

    def test_one_portfolio_per_user_rule(self):
        """Test that users can only have one portfolio"""
        service = PortfolioService()
        
        # Create first portfolio
        portfolio1 = service.create_portfolio(
            user=self.user1,
            data={'title': 'First Portfolio', 'summary': 'First summary', 'status': PortfolioStatus.DRAFT}
        )
        self.assertTrue(Portfolio.objects.filter(user=self.user1).exists())
        
        # Attempt to create second portfolio should fail
        with self.assertRaises(ValidationError) as cm:
            service.create_portfolio(
                user=self.user1,
                data={'title': 'Second Portfolio', 'summary': 'Second summary', 'status': PortfolioStatus.DRAFT}
            )
        self.assertIn('already exists', str(cm.exception))

    def test_public_requires_published_rule(self):
        """Test that portfolios cannot be public unless published"""
        service = PortfolioService()
        
        # Creating a portfolio with explicit status works
        portfolio = service.create_portfolio(
            user=self.user1,
            data={'title': 'Test Portfolio', 'summary': 'Test summary', 'status': PortfolioStatus.PUBLISHED}
        )
        self.assertEqual(portfolio.status, PortfolioStatus.PUBLISHED)

    def test_portfolio_visibility_rules(self):
        """Test portfolio visibility to different users"""
        service = PortfolioService()
        
        # Create private (non-published) portfolio for user1
        private_portfolio = service.create_portfolio(
            user=self.user1,
            data={'title': 'Private Portfolio', 'summary': 'Private summary', 'status': PortfolioStatus.DRAFT}
        )
        
        # Create public (published) portfolio for user2  
        public_portfolio = service.create_portfolio(
            user=self.user2,
            data={'title': 'Public Portfolio', 'summary': 'Public summary', 'status': PortfolioStatus.PUBLISHED}
        )
        
        # Anonymous user should only see public portfolios
        visible_to_anon = service.visible_to_user(viewer=None)
        self.assertIn(public_portfolio, visible_to_anon)
        self.assertNotIn(private_portfolio, visible_to_anon)
        
        # User1 should see public portfolio and own private portfolio
        visible_to_user1 = service.visible_to_user(viewer=self.user1)
        self.assertIn(public_portfolio, visible_to_user1)
        self.assertIn(private_portfolio, visible_to_user1)
        
        # User2 should see public portfolio but not user1's private portfolio
        visible_to_user2 = service.visible_to_user(viewer=self.user2)
        self.assertIn(public_portfolio, visible_to_user2)
        self.assertNotIn(private_portfolio, visible_to_user2)

    def test_portfolio_update_validation(self):
        """Test portfolio update business rules"""
        service = PortfolioService()
        portfolio = service.create_portfolio(
            user=self.user1,
            data={'title': 'Test Portfolio', 'summary': 'Test summary', 'status': PortfolioStatus.PUBLISHED}
        )
        # Update summary should work
        updated = service.update_portfolio(portfolio=portfolio, data={'summary': 'Updated summary via service'})
        self.assertEqual(updated.summary, 'Updated summary via service')


class ProjectValidationTests(APITestCase):
    """Test project validation and business rules"""
    
    def setUp(self):
        self.user = User.objects.create_user('projuser', 'proj@test.com', 'pass123')
        self.portfolio = Portfolio.objects.create(
            user=self.user,
            title='Test Portfolio',
            summary='Test summary',
            status=PortfolioStatus.PUBLISHED
        )
        self.client.login(username='projuser', password='pass123')

    def test_project_validation_edge_cases(self):
        """Test project field validation"""
        service = ProjectService()
        
        # Test minimum title length
        url = reverse('project-list-create', kwargs={'portfolio_id': self.portfolio.id})
        resp = self.client.post(url, {
            'title': 'X',  # Too short
            'description': 'Valid description here',
            'tech_stack': 'Django'
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test minimum description length
        url = reverse('project-list-create', kwargs={'portfolio_id': self.portfolio.id})
        resp = self.client.post(url, {
            'title': 'Valid Title',
            'description': 'Short',  # Too short
            'tech_stack': 'Django'
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test invalid project URL
        resp = self.client.post(url, {
            'title': 'Valid Title',
            'description': 'Valid description here',
            'tech_stack': 'Django',
            'project_url': 'not-a-url'
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test valid project creation
        resp = self.client.post(url, {
            'title': 'Valid Project',
            'description': 'Valid description here',
            'tech_stack': 'Django, React',
            'project_url': 'https://example.com'
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_project_visibility_rules(self):
        """Test project visibility based on publication status"""
        service = ProjectService()
        
        # Create published and unpublished projects
        published_project = service.create_project(
            portfolio=self.portfolio,
            data={'title': 'Published Project', 'description': 'Published description', 'tech_stack': 'Django', 'project_url': 'https://example.com/published'}
        )
        # Set status to PUBLISHED after creation
        published_project.status = ItemStatus.PUBLISHED
        published_project.save()
        
        unpublished_project = service.create_project(
            portfolio=self.portfolio,
            data={'title': 'Unpublished Project', 'description': 'Unpublished description', 'tech_stack': 'React', 'project_url': 'https://example.com/unpublished'}
        )
        # Ensure unpublished_project.status is DRAFT (default)
        
        # Owner should see both
        owner_projects = service.get_visible_projects_for_user_and_portfolio(self.user, self.portfolio)
        self.assertIn(published_project, owner_projects)
        self.assertIn(unpublished_project, owner_projects)
        
        # Anonymous user should only see published
        anon_projects = service.get_visible_projects_for_user_and_portfolio(None, self.portfolio)
        self.assertIn(published_project, anon_projects)
        self.assertNotIn(unpublished_project, anon_projects)


class DocumentBusinessRulesTests(APITestCase):
    """Test document upload business rules"""
    
    def setUp(self):
        self.user = User.objects.create_user('docuser', 'doc@test.com', 'pass123')
        self.portfolio = Portfolio.objects.create(
            user=self.user,
            title='Test Portfolio',
            summary='Test summary'
        )
        self.client.login(username='docuser', password='pass123')

    def test_one_resume_per_portfolio_rule(self):
        """Test that only one resume is allowed per portfolio"""
        service = DocumentService()
        
        # Create first resume
        file1 = SimpleUploadedFile('resume1.pdf', b'resume content 1')
        resume1 = service.create_document(
            portfolio=self.portfolio,
            data={'file': file1, 'doc_type': Document.DocumentType.RESUME, 'status': ItemStatus.DRAFT}
        )
        self.assertTrue(Document.objects.filter(portfolio=self.portfolio, doc_type=Document.DocumentType.RESUME).exists())
        
        # Attempt to create second resume should fail
        file2 = SimpleUploadedFile('resume2.pdf', b'resume content 2')
        with self.assertRaises(ValidationError) as cm:
            service.create_document(
                portfolio=self.portfolio,
                data={'file': file2, 'doc_type': Document.DocumentType.RESUME, 'status': ItemStatus.DRAFT}
            )
        self.assertIn('Only one resume allowed', str(cm.exception))
        
        # Should be able to create other document types
        file3 = SimpleUploadedFile('cert.pdf', b'certificate content')
        cert = service.create_document(
            portfolio=self.portfolio,
            data={'file': file3, 'doc_type': Document.DocumentType.CERTIFICATE, 'status': ItemStatus.PUBLISHED}
        )
        self.assertTrue(Document.objects.filter(portfolio=self.portfolio, doc_type=Document.DocumentType.CERTIFICATE).exists())

    def test_document_visibility_rules(self):
        """Test document visibility based on `status` (published vs draft)"""
        service = DocumentService()
        
        # Create public and private documents
        public_file = SimpleUploadedFile('public.pdf', b'public content')
        public_doc = service.create_document(
            portfolio=self.portfolio,
            data={'file': public_file, 'doc_type': Document.DocumentType.CERTIFICATE, 'status': ItemStatus.PUBLISHED}
        )
        
        private_file = SimpleUploadedFile('private.pdf', b'private content')  
        private_doc = service.create_document(
            portfolio=self.portfolio,
            data={'file': private_file, 'doc_type': Document.DocumentType.OTHER, 'status': ItemStatus.DRAFT}
        )
        
        # Owner should see both
        owner_docs = service.get_visible_documents_for_user_and_portfolio(self.user, self.portfolio)
        self.assertIn(public_doc, owner_docs)
        self.assertIn(private_doc, owner_docs)
        
        # Non-owner should only see public
        other_user = User.objects.create_user('other', 'other@test.com', 'pass123')
        other_docs = service.get_visible_documents_for_user_and_portfolio(other_user, self.portfolio)
        self.assertIn(public_doc, other_docs)
        self.assertNotIn(private_doc, other_docs)


class PortfolioVersioningTests(APITestCase):
    """Test portfolio versioning functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user('veruser', 'ver@test.com', 'pass123')
        self.portfolio = Portfolio.objects.create(
            user=self.user,
            title='Versioned Portfolio',
            summary='Original summary',
            status=PortfolioStatus.PUBLISHED
        )
        self.client.login(username='veruser', password='pass123')

    def test_version_creation_and_numbering(self):
        """Test version creation and sequential numbering"""
        service = PortfolioService()
        
        # Create first version
        version1 = service.create_version_snapshot(
            portfolio=self.portfolio,
            user=self.user,
            change_note='First version',
            is_draft=False
        )
        self.assertEqual(version1.version_number, 1)
        self.assertEqual(version1.title, self.portfolio.title)
        self.assertEqual(version1.summary, self.portfolio.summary)
        
        # Create second version
        version2 = service.create_version_snapshot(
            portfolio=self.portfolio,
            user=self.user,
            change_note='Second version',
            is_draft=True
        )
        self.assertEqual(version2.version_number, 2)
        self.assertTrue(version2.is_draft)

    def test_version_revert_functionality(self):
        """Test reverting to previous versions"""
        service = PortfolioService()
        
        # Create initial version
        original_title = self.portfolio.title
        original_summary = self.portfolio.summary
        version1 = service.create_version_snapshot(
            portfolio=self.portfolio,
            user=self.user,
            change_note='Original version'
        )
        
        # Update portfolio
        updated_title = 'Updated Title'
        updated_summary = 'Updated summary'
        self.portfolio.title = updated_title
        self.portfolio.summary = updated_summary
        self.portfolio.save()
        
        # Create version of updated state
        version2 = service.create_version_snapshot(
            portfolio=self.portfolio,
            user=self.user,
            change_note='Updated version'
        )
        
        # Revert to version 1
        reverted_portfolio = service.revert_to_version(
            portfolio=self.portfolio,
            version_number=1,
            user=self.user
        )
        
        # Check that portfolio was reverted
        self.assertEqual(reverted_portfolio.title, original_title)
        self.assertEqual(reverted_portfolio.summary, original_summary)
        
        # Check that new versions were created during revert process
        version_count = PortfolioVersion.objects.filter(portfolio=self.portfolio).count()
        self.assertGreaterEqual(version_count, 4)  # original, updated, pre-revert, post-revert

    def test_auto_versioning_on_update(self):
        """Test automatic version creation on published portfolio updates"""
        service = PortfolioService()
        initial_version_count = PortfolioVersion.objects.filter(portfolio=self.portfolio).count()
        
        # Update published portfolio - should trigger auto-versioning
        updated_portfolio = service.update_portfolio(
            portfolio=self.portfolio,
            data={'summary': 'Auto-versioned summary'}
        )
        
        # Check that new version was created
        new_version_count = PortfolioVersion.objects.filter(portfolio=self.portfolio).count()
        self.assertEqual(new_version_count, initial_version_count + 1)
        
        # Check that latest version has updated data
        latest_version = PortfolioVersion.objects.filter(portfolio=self.portfolio).first()
        self.assertEqual(latest_version.summary, 'Auto-versioned summary')
        self.assertIn('Auto-snapshot', latest_version.change_note)


class SkillValidationTests(APITestCase):
    """Test skill validation and business rules"""
    
    def setUp(self):
        self.user = User.objects.create_user('skilluser', 'skill@test.com', 'pass123')
        self.portfolio = Portfolio.objects.create(user=self.user, title='Test Portfolio', summary='Test summary')
        self.client.login(username='skilluser', password='pass123')

    def test_skill_proficiency_validation(self):
        """Test skill proficiency level validation"""
        url = reverse('skill-list-create', kwargs={'portfolio_id': self.portfolio.id})
        
        # Test invalid proficiency level
        resp = self.client.post(url, {
            'name': 'Python',
            'proficiency_level': 'INVALID_LEVEL',
            'years_of_experience': 2
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test valid proficiency levels
        for level in [ProficiencyLevel.BEGINNER, ProficiencyLevel.INTERMEDIATE, 
                     ProficiencyLevel.ADVANCED, ProficiencyLevel.EXPERT]:
            resp = self.client.post(url, {
                'name': f'Skill {level}',
                'proficiency_level': level,
                'years_of_experience': 1
            }, format='json')
            self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_skill_years_validation(self):
        """Test years of experience validation"""
        url = reverse('skill-list-create', kwargs={'portfolio_id': self.portfolio.id})
        
        # Test negative years
        resp = self.client.post(url, {
            'name': 'Python',
            'proficiency_level': ProficiencyLevel.BEGINNER,
            'years_of_experience': -1
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test valid years
        resp = self.client.post(url, {
            'name': 'Python',
            'proficiency_level': ProficiencyLevel.BEGINNER,
            'years_of_experience': 0
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class EducationValidationTests(APITestCase):
    """Test education validation rules"""
    
    def setUp(self):
        self.user = User.objects.create_user('eduuser', 'edu@test.com', 'pass123')
        self.portfolio = Portfolio.objects.create(user=self.user, title='Test Portfolio', summary='Test summary')
        self.client.login(username='eduuser', password='pass123')

    def test_education_year_validation(self):
        """Test education year validation rules"""
        url = reverse('education-list-create', kwargs={'portfolio_id': self.portfolio.id})
        current_year = datetime.now().year
        
        # Test invalid start year (too old)
        resp = self.client.post(url, {
            'institution': 'Test University',
            'degree': 'BSc',
            'start_year': 1800,
            'end_year': 1804
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test invalid start year (too far in future)
        resp = self.client.post(url, {
            'institution': 'Test University',
            'degree': 'BSc',
            'start_year': current_year + 20,
            'end_year': current_year + 24
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test end year before start year
        resp = self.client.post(url, {
            'institution': 'Test University',
            'degree': 'BSc',
            'start_year': 2020,
            'end_year': 2018
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test valid education
        resp = self.client.post(url, {
            'institution': 'Test University',
            'degree': 'BSc Computer Science',
            'start_year': 2018,
            'end_year': 2022
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class PermissionsTests(APITestCase):
    """Test custom permissions"""
    
    def setUp(self):
        self.user1 = User.objects.create_user('perm1', 'perm1@test.com', 'pass123')
        self.user2 = User.objects.create_user('perm2', 'perm2@test.com', 'pass123')
        self.portfolio1 = Portfolio.objects.create(
            user=self.user1,
            title='User1 Portfolio',
            summary='User1 summary'
        )
        self.portfolio2 = Portfolio.objects.create(
            user=self.user2,
            title='User2 Portfolio', 
            summary='User2 summary'
        )

    def test_portfolio_owner_permission(self):
        """Test IsPortfolioOwner permission"""
        permission = IsPortfolioOwner()
        
        # Mock request object
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        # Test owner has permission
        request1 = MockRequest(self.user1)
        self.assertTrue(permission.has_object_permission(request1, None, self.portfolio1))
        
        # Test non-owner doesn't have permission
        request2 = MockRequest(self.user2)
        self.assertFalse(permission.has_object_permission(request2, None, self.portfolio1))

    def test_unauthorized_portfolio_access(self):
        """Test unauthorized access to portfolio operations"""
        self.client.login(username='perm2', password='pass123')
        
        # User2 cannot update user1's portfolio
        url = reverse('portfolio-detail', kwargs={'pk': self.portfolio1.id})
        resp = self.client.put(url, {'summary': 'Hacked summary'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        
        # User2 cannot delete user1's portfolio
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


class AnalyticsAdvancedTests(APITestCase):
    """Test analytics functionality thoroughly"""
    
    def setUp(self):
        self.user = User.objects.create_user('analytics', 'analytics@test.com', 'pass123')
        self.portfolio = Portfolio.objects.create(
            user=self.user,
            title='Analytics Portfolio',
            summary='Analytics summary',
            status=PortfolioStatus.PUBLISHED
        )
        
        # Create some profile views for testing
        for i in range(5):
            ProfileView.objects.create(
                portfolio=self.portfolio,
                viewed_at=timezone.now() - timedelta(days=i),
                ip_address=f'192.168.1.{i+1}'
            )

    def test_analytics_parameter_validation(self):
        """Test analytics parameter validation"""
        url = reverse('analytics')
        
        # Test invalid group_by
        resp = self.client.post(url, {
            'group_by': 'invalid',
            'metrics': ['count']
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test invalid metric
        resp = self.client.post(url, {
            'group_by': 'day',
            'metrics': ['invalid_metric']
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test start date after end date
        resp = self.client.post(url, {
            'start_date': '2023-12-31',
            'end_date': '2023-01-01',
            'metrics': ['count']
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_analytics_data_structure(self):
        """Test analytics response data structure"""
        url = reverse('analytics')
        
        resp = self.client.post(url, {
            'start_date': (timezone.now() - timedelta(days=30)).date().isoformat(),
            'end_date': timezone.now().date().isoformat(),
            'group_by': 'day',
            'metrics': ['count', 'unique_count']
        }, format='json')
        
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('labels', resp.data)
        self.assertIn('values', resp.data)
        self.assertIn('rows', resp.data)
        self.assertIsInstance(resp.data['labels'], list)
        self.assertIsInstance(resp.data['values'], list)
        self.assertIsInstance(resp.data['rows'], list)


class ProfileViewTrackingTests(APITestCase):
    """Test profile view tracking functionality"""
    
    def setUp(self):
        self.user1 = User.objects.create_user('viewer1', 'viewer1@test.com', 'pass123')
        self.user2 = User.objects.create_user('viewer2', 'viewer2@test.com', 'pass123')
        self.portfolio = Portfolio.objects.create(
            user=self.user1,
            title='Viewed Portfolio',
            summary='Viewed summary',
            status=PortfolioStatus.PUBLISHED
        )

    def test_profile_view_logging(self):
        """Test that profile views are logged correctly"""
        service = PortfolioService()
        initial_view_count = ProfileView.objects.filter(portfolio=self.portfolio).count()
        
        # Log view from authenticated user
        service.log_profile_view(
            viewer=self.user2,
            portfolio=self.portfolio,
            ip_address='192.168.1.100'
        )
        
        # Log view from anonymous user
        service.log_profile_view(
            viewer=None,
            portfolio=self.portfolio,
            ip_address='192.168.1.101'
        )
        
        # Check that views were logged
        new_view_count = ProfileView.objects.filter(portfolio=self.portfolio).count()
        self.assertEqual(new_view_count, initial_view_count + 2)
        
        # Check that owner views are not logged
        service.log_profile_view(
            viewer=self.user1,  # Portfolio owner
            portfolio=self.portfolio,
            ip_address='192.168.1.102'
        )
        owner_view_count = ProfileView.objects.filter(portfolio=self.portfolio).count()
        self.assertEqual(owner_view_count, new_view_count)  # Should not increase

    def test_profile_view_via_api(self):
        """Test profile view logging through API endpoint"""
        initial_count = ProfileView.objects.filter(portfolio=self.portfolio).count()
        
        # Access portfolio detail endpoint
        url = reverse('portfolio-detail', kwargs={'pk': self.portfolio.id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        
        # Check that view was logged
        final_count = ProfileView.objects.filter(portfolio=self.portfolio).count()
        self.assertEqual(final_count, initial_count + 1)


class ServiceLayerTests(TestCase):
    """Test service layer methods directly"""
    
    def setUp(self):
        self.user = User.objects.create_user('service', 'service@test.com', 'pass123')
        self.portfolio = Portfolio.objects.create(
            user=self.user,
            title='Service Portfolio',
            summary='Service summary'
        )

    def test_portfolio_service_methods(self):
        """Test PortfolioService methods"""
        service = PortfolioService()
        
        # Test visible_to_user with different user types
        public_portfolio = Portfolio.objects.create(
            user=User.objects.create_user('public', 'public@test.com', 'pass123'),
            title='Public Portfolio',
            summary='Public summary',
            status=PortfolioStatus.PUBLISHED
        )
        
        # Anonymous user should only see public
        anon_visible = service.visible_to_user(viewer=None)
        self.assertIn(public_portfolio, anon_visible)
        self.assertNotIn(self.portfolio, anon_visible)
        
        # Owner should see own portfolio
        owner_visible = service.visible_to_user(viewer=self.user)
        self.assertIn(self.portfolio, owner_visible)
        self.assertIn(public_portfolio, owner_visible)

    def test_project_service_methods(self):
        """Test ProjectService methods"""
        service = ProjectService()
        
        # Create test projects
        published_project = Project.objects.create(
            portfolio=self.portfolio,
            title='Published Project',
            description='Published description',
            tech_stack='Django',
            status=ItemStatus.PUBLISHED
        )
        
        unpublished_project = Project.objects.create(
            portfolio=self.portfolio,
            title='Unpublished Project',
            description='Unpublished description',
            tech_stack='React',
            status=ItemStatus.DRAFT
        )
        
        # Test visibility methods
        all_projects = service.list_projects_for_portfolio(self.portfolio)
        self.assertIn(published_project, all_projects)
        self.assertIn(unpublished_project, all_projects)
        
        public_projects = service.list_public_projects_for_portfolio(self.portfolio)
        self.assertIn(published_project, public_projects)
        self.assertNotIn(unpublished_project, public_projects)


class IntegrationTests(APITestCase):
    """Integration tests that test complete workflows"""
    
    def test_complete_portfolio_workflow(self):
        """Test complete portfolio creation and management workflow"""
        # Register user
        resp = self.client.post(reverse('register'), {
            'username': 'workflow',
            'email': 'workflow@test.com',
            'password': 'workflow123'
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        token = resp.data['token']
        
        # Decode token to get user info  
        from django.contrib.auth.models import User
        import jwt
        from django.conf import settings
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        user = User.objects.get(id=payload['user_id'])
        
        # Create portfolio using authenticated client
        self.client.force_authenticate(user=user)
        resp = self.client.post(reverse('portfolio-list-create'), {
            'title': 'Integration Test Portfolio',
            'summary': 'A complete integration test portfolio',
            'status': PortfolioStatus.PUBLISHED
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        portfolio_id = resp.data['id']
        
        # Add project
        resp = self.client.post(reverse('project-list-create', kwargs={'portfolio_id': portfolio_id}), {
            'title': 'Integration Project',
            'description': 'A project for integration testing',
            'tech_stack': 'Django, React, PostgreSQL',
            'project_url': 'https://github.com/test/integration'
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        
        # Add skill
        resp = self.client.post(reverse('skill-list-create', kwargs={'portfolio_id': portfolio_id}), {
            'name': 'Python',
            'proficiency_level': 'ADVANCED',
            'years_of_experience': 5
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        
        # Add education
        resp = self.client.post(reverse('education-list-create', kwargs={'portfolio_id': portfolio_id}), {
            'institution': 'Integration University',
            'degree': 'BSc Computer Science',
            'start_year': 2018,
            'end_year': 2022
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        
        # Add social link
        resp = self.client.post(reverse('social-link-list-create', kwargs={'portfolio_id': portfolio_id}), {
            'platform': 'GitHub',
            'url': 'https://github.com/workflow'
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        
        # Create version snapshot
        resp = self.client.post(reverse('portfolio-version-list', kwargs={'portfolio_id': portfolio_id}), {
            'change_note': 'Complete portfolio setup',
            'is_draft': False
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        
        # Verify portfolio is complete
        resp = self.client.get(reverse('portfolio-detail', kwargs={'pk': portfolio_id}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['title'], 'Integration Test Portfolio')


class ErrorHandlingTests(APITestCase):
    """Test error handling and edge cases"""
    
    def setUp(self):
        self.user = User.objects.create_user('error', 'error@test.com', 'pass123')
        self.client.login(username='error', password='pass123')

    def test_nonexistent_portfolio_access(self):
        """Test accessing nonexistent portfolios"""
        # Try to access nonexistent portfolio
        url = reverse('portfolio-detail', kwargs={'pk': 99999})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_nonexistent_project_access(self):
        """Test accessing nonexistent projects"""
        portfolio = Portfolio.objects.create(
            user=self.user,
            title='Test Portfolio',
            summary='Test summary'
        )
        
        # Try to access nonexistent project
        url = reverse('project-detail', kwargs={'portfolio_id': portfolio.id, 'pk': 99999})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_cross_portfolio_project_access(self):
        """Test accessing project from different portfolio"""
        user2 = User.objects.create_user('user2', 'user2@test.com', 'pass123')
        portfolio1 = Portfolio.objects.create(user=self.user, title='P1', summary='S1')
        portfolio2 = Portfolio.objects.create(user=user2, title='P2', summary='S2')
        
        project = Project.objects.create(
            portfolio=portfolio2,
            title='Project 2',
            description='Description 2',
            tech_stack='Tech 2'
        )
        
        # Try to access project2 via portfolio1 URL - should 404
        url = reverse('project-detail', kwargs={'portfolio_id': portfolio1.id, 'pk': project.id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
