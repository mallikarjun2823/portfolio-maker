
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

	def test_get_all_projects(self):
		url = reverse('project-list-create')
		response = self.client.get(url)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIsInstance(response.data, list)
		self.assertGreaterEqual(len(response.data), 1)

	def test_create_project(self):
		url = reverse('project-list-create')
		data = {
			'title': 'New Project',
			'description': 'A new test project',
			'tech_stack': 'Django, DRF',
			'project_url': 'https://example.com/new',
			'is_published': True,
			'portfolio': self.portfolio.id
		}
		response = self.client.post(url, data, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['title'], 'New Project')
