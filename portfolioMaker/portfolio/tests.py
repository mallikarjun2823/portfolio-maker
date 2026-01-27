
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import Project, Portfolio

class ProjectAPITestCase(APITestCase):
	@classmethod
	def setUpTestData(cls):
		# Seed data using the management command
		from django.core.management import call_command
		call_command('seed')
		cls.user = User.objects.get(username='testuser')
		cls.portfolio = Portfolio.objects.get(user=cls.user)

	def setUp(self):
		self.client.login(username='testuser', password='testpass123')

	# List/Get Tests
	def test_get_all_projects(self):
		"""Test retrieving all public projects"""
		url = reverse('project-list-create')
		response = self.client.get(url)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIsInstance(response.data, list)
		self.assertGreaterEqual(len(response.data), 1)

	def test_get_all_projects_without_auth(self):
		"""Test that unauthenticated users can view all projects"""
		self.client.logout()
		url = reverse('project-list-create')
		response = self.client.get(url)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIsInstance(response.data, list)

	def test_get_project_detail(self):
		"""Test retrieving a single project by ID"""
		project = Project.objects.first()
		url = reverse('project-detail', kwargs={'pk': project.id})
		response = self.client.get(url)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['title'], project.title)

	def test_get_project_detail_not_found(self):
		"""Test retrieving a non-existent project returns 404"""
		url = reverse('project-detail', kwargs={'pk': 9999})
		response = self.client.get(url)
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	# Create Tests
	def test_create_project(self):
		"""Test creating a new project when authenticated"""
		url = reverse('project-list-create')
		data = {
			'title': 'New Project',
			'description': 'A new test project description',
			'tech_stack': 'Django, DRF',
			'project_url': 'https://example.com/new',
			'is_published': True,
			'portfolio': self.portfolio.id
		}
		response = self.client.post(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['title'], 'New Project')
		self.assertTrue(Project.objects.filter(title='New Project').exists())

	def test_create_project_without_auth(self):
		"""Test that unauthenticated users cannot create projects"""
		self.client.logout()
		url = reverse('project-list-create')
		data = {
			'title': 'Unauthorized Project',
			'description': 'This should fail',
			'tech_stack': 'Django',
			'project_url': 'https://example.com/fail',
			'is_published': True,
			'portfolio': self.portfolio.id
		}
		response = self.client.post(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_create_project_invalid_data(self):
		"""Test creating a project with invalid data"""
		url = reverse('project-list-create')
		data = {
			'title': 'Short',  # Too short
			'description': 'Bad',  # Too short
			'tech_stack': '',
			'project_url': 'not-a-url',
			'portfolio': self.portfolio.id
		}
		response = self.client.post(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	# Update Tests
	def test_update_project(self):
		"""Test updating a project"""
		project = Project.objects.first()
		url = reverse('project-detail', kwargs={'pk': project.id})
		data = {
			'title': 'Updated Project Title',
			'description': 'Updated project description for testing'
		}
		response = self.client.put(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		project.refresh_from_db()
		self.assertEqual(project.title, 'Updated Project Title')

	def test_update_project_partial(self):
		"""Test partially updating a project"""
		project = Project.objects.first()
		original_description = project.description
		url = reverse('project-detail', kwargs={'pk': project.id})
		data = {'title': 'Partially Updated'}
		response = self.client.put(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		project.refresh_from_db()
		self.assertEqual(project.title, 'Partially Updated')
		self.assertEqual(project.description, original_description)

	def test_update_project_without_auth(self):
		"""Test that unauthenticated users cannot update projects"""
		self.client.logout()
		project = Project.objects.first()
		url = reverse('project-detail', kwargs={'pk': project.id})
		data = {'title': 'Unauthorized Update'}
		response = self.client.put(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_update_nonexistent_project(self):
		"""Test updating a non-existent project returns 404"""
		url = reverse('project-detail', kwargs={'pk': 9999})
		data = {'title': 'Update Nonexistent'}
		response = self.client.put(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	# Delete Tests
	def test_delete_project(self):
		"""Test deleting a project"""
		project = Project.objects.create(
			portfolio=self.portfolio,
			title='Project to Delete',
			description='This project will be deleted for testing purposes',
			tech_stack='Django'
		)
		project_id = project.id
		url = reverse('project-detail', kwargs={'pk': project_id})
		response = self.client.delete(url)
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(Project.objects.filter(id=project_id).exists())

	def test_delete_project_without_auth(self):
		"""Test that unauthenticated users cannot delete projects"""
		self.client.logout()
		project = Project.objects.first()
		url = reverse('project-detail', kwargs={'pk': project.id})
		response = self.client.delete(url)
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
		self.assertTrue(Project.objects.filter(id=project.id).exists())

	def test_delete_nonexistent_project(self):
		"""Test deleting a non-existent project returns 404"""
		url = reverse('project-detail', kwargs={'pk': 9999})
		response = self.client.delete(url)
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PortfolioAPITestCase(APITestCase):
	@classmethod
	def setUpTestData(cls):
		from django.core.management import call_command
		call_command('seed')
		cls.user = User.objects.get(username='testuser')
		cls.portfolio = Portfolio.objects.get(user=cls.user)

	def setUp(self):
		self.client.login(username='testuser', password='testpass123')

	def test_list_portfolios(self):
		"""GET list of portfolios visible to the user"""
		url = reverse('portfolio-list-create')
		response = self.client.get(url)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIsInstance(response.data, list)

	def test_create_portfolio_existing_user(self):
		"""Creating a portfolio when one exists should fail (business rule)"""
		url = reverse('portfolio-list-create')
		data = {
			'title': 'Another Portfolio',
			'summary': 'Trying to create a second portfolio',
			'is_published': False,
			'is_public': False
		}
		response = self.client.post(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_create_portfolio_new_user(self):
		"""A new user without a portfolio can create one"""
		new_user = User.objects.create_user(username='newuser', password='newpass123')
		self.client.logout()
		self.client.login(username='newuser', password='newpass123')
		url = reverse('portfolio-list-create')
		data = {
			'title': 'New User Portfolio',
			'summary': 'A portfolio for new user',
			'is_published': True,
			'is_public': True
		}
		response = self.client.post(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(Portfolio.objects.filter(user=new_user).exists())

	def test_retrieve_portfolio(self):
		url = reverse('portfolio-detail', kwargs={'pk': self.portfolio.id})
		response = self.client.get(url)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['id'], self.portfolio.id)

	def test_update_portfolio_owner(self):
		url = reverse('portfolio-detail', kwargs={'pk': self.portfolio.id})
		data = {'summary': 'Updated summary via API'}
		response = self.client.put(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.portfolio.refresh_from_db()
		self.assertEqual(self.portfolio.summary, 'Updated summary via API')

	def test_update_portfolio_not_owner(self):
		other = User.objects.create_user(username='other', password='otherpass')
		self.client.logout()
		self.client.login(username='other', password='otherpass')
		url = reverse('portfolio-detail', kwargs={'pk': self.portfolio.id})
		data = {'summary': 'Malicious update'}
		response = self.client.put(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_cannot_set_public_before_published(self):
		# Owner tries to set is_public True while is_published False
		self.portfolio.is_published = False
		self.portfolio.is_public = False
		self.portfolio.save()
		url = reverse('portfolio-detail', kwargs={'pk': self.portfolio.id})
		data = {'is_public': True}
		response = self.client.put(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_delete_portfolio_owner(self):
		url = reverse('portfolio-detail', kwargs={'pk': self.portfolio.id})
		response = self.client.delete(url)
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(Portfolio.objects.filter(id=self.portfolio.id).exists())

	def test_delete_portfolio_not_owner(self):
		# re-seed a portfolio for the owner since previous test deleted it
		from django.core.management import call_command
		call_command('seed')
		port = Portfolio.objects.get(user__username='testuser')
		other = User.objects.create_user(username='other2', password='otherpass2')
		self.client.logout()
		self.client.login(username='other2', password='otherpass2')
		url = reverse('portfolio-detail', kwargs={'pk': port.id})
		response = self.client.delete(url)
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
		self.assertTrue(Portfolio.objects.filter(id=port.id).exists())
