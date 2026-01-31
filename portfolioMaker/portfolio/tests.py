
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Project, Portfolio, Skill, Education, SocialLink, Document, PortfolioVersion
from datetime import date

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
                'is_published': True,
                'is_public': True
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
        data = {'title': 'Dup', 'summary': 'Dup', 'is_published': False, 'is_public': False}
        resp = self.client.post(url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_portfolio_new_user(self):
        new_user = User.objects.create_user(username='newuser', password='newpass')
        self.client.logout()
        self.client.login(username='newuser', password='newpass')
        url = reverse('portfolio-list-create')
        data = {'title': 'New User Portfolio', 'summary': 'A portfolio for new user', 'is_published': True, 'is_public': True}
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
        self.portfolio.is_published = False
        self.portfolio.is_public = False
        self.portfolio.save()
        url = reverse('portfolio-detail', kwargs={'pk': self.portfolio.id})
        resp = self.client.put(url, {'is_public': True}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class ProjectTests(BaseSeededTestCase):
    def test_list_projects(self):
        url = reverse('project-list-create', kwargs={'portfolio_id': self.portfolio.id})
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsInstance(resp.data, list)

    def test_create_project(self):
        url = reverse('project-list-create', kwargs={'portfolio_id': self.portfolio.id})
        data = {'title': 'ProjX', 'description': 'A valid description for project', 'tech_stack': 'Django', 'project_url': 'https://ex.com', 'is_published': True}
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
