from . import models

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
