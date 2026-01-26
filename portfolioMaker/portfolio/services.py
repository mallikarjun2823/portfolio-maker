from urllib.parse import urlparse
from . import models
from datetime import datetime
class ProjectService:

    def list_public_projects(self):
        return models.Project.objects.filter(is_published=True)

    def list_projects_for_user(self, user):
        return models.Project.objects.filter(
            portfolio__user=user
        )

    def create_project(self, *, portfolio, data):
        return models.Project.objects.create(
            portfolio=portfolio,
            title=data["title"],
            description=data["description"],
            tech_stack=data["tech_stack"],
            project_url=data.get("project_url")
        )
    
    def get_project_by_id(self, project_id):
        try:
            return models.Project.objects.get(id=project_id)
        except models.Project.DoesNotExist:
            return None
        
    def update_project(self, request, data):
        try:
            project = models.Project.objects.get(id=request)
            project.title = data.get("title", project.title)
            project.description = data.get("description", project.description)
            project.tech_stack = data.get("tech_stack", project.tech_stack)
            project.project_url = data.get("project_url", project.project_url)
            project.is_published = data.get("is_published", project.is_published)
            project.created_at = datetime.now()
            project.save()
            return project
        except models.Project.DoesNotExist:
            return None
    
    def delete_project(self, request):
        try:
            project = models.Project.objects.get(id=request)
            project.delete()
            return True
        except models.Project.DoesNotExist:
            return False