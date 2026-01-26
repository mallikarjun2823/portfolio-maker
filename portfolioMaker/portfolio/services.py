from . import models
from urllib.parse import urlparse

# region: Project Service
class ProjectService:

    def list_public_projects(self):
        return models.Project.objects.filter(is_published=True)

    def list_projects_for_user(self, user):
        return models.Project.objects.filter(
            portfolio__user=user
        )

    def list_projects_for_portfolio(self, portfolio):
        return models.Project.objects.filter(portfolio=portfolio)

    def list_public_projects_for_portfolio(self, portfolio):
        return models.Project.objects.filter(portfolio=portfolio, is_published=True)

    def get_project_by_id(self, project_id):
        try:
            project = models.Project.objects.get(id=project_id)
            return project
        except models.Project.DoesNotExist:
            return None

    def get_project_by_id_and_portfolio(self, project_id, portfolio_id):
        try:
            return models.Project.objects.get(id=project_id, portfolio__id=portfolio_id)
        except models.Project.DoesNotExist:
            return None

    def create_project(self, *, portfolio, data):
        return models.Project.objects.create(
            portfolio=portfolio,
            title=data["title"],
            description=data["description"],
            tech_stack=data["tech_stack"],
            project_url=data.get("project_url")
        )

    def update_project(self, *, project, data):
        for field, value in data.items():
            setattr(project, field, value)
        project.save()
        return project

    def delete_project(self, *, project):
        project.delete()# endregion