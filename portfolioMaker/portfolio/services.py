from . import models
from urllib.parse import urlparse
from django.db.models import Q
# region: Project Service
class ProjectService:
    def get_visible_projects_for_user_and_portfolio(self, user, portfolio):
        # Only business logic, no request/serializer
        if user.is_authenticated and user == portfolio.user:
            return self.list_projects_for_portfolio(portfolio)
        else:
            return self.list_public_projects_for_portfolio(portfolio)

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

class PortfolioService:
    def visible_to_user(self, *, viewer):
        """
        Returns portfolios visible to the viewer.
        - Anonymous users: public portfolios only
        - Authenticated users: public + own private portfolio
        """
        if viewer and viewer.is_authenticated:
            return models.Portfolio.objects.filter(
                Q(is_public=True) | Q(user=viewer)
            )
        return models.Portfolio.objects.filter(is_public=True)
    
    def create_portfolio(self, *, user, data):
        """
        Business rules:
        - A user can have only one portfolio
        - A portfolio cannot be public unless it is published
        """

        # Optional but recommended: one-portfolio-per-user rule
        if models.Portfolio.objects.filter(user=user).exists():
            raise ValueError("Portfolio already exists for this user")

        is_published = data.get("is_published", False)
        is_public = data.get("is_public", False)

        # Domain invariant enforcement
        if is_public and not is_published:
            raise ValueError("Portfolio cannot be public unless it is published")

        portfolio = models.Portfolio.objects.create(
            user=user,
            title=data["title"],
            description=data.get("description", ""),
            is_published=is_published,
            is_public=is_public,
        )

        return portfolio


        