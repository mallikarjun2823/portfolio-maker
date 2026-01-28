from . import models
from urllib.parse import urlparse
from django.db.models import Q
from rest_framework.exceptions import ValidationError
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
        project.delete()
# endregion

# region: Skill Service
class SkillService:
    def get_visible_skills_for_user_and_portfolio(self, user, portfolio):
        if user.is_authenticated and user == portfolio.user:
            return self.list_skills_for_portfolio(portfolio)
        else:
            return self.list_public_skills_for_portfolio(portfolio)

    def list_skills_for_portfolio(self, portfolio):
        return models.Skill.objects.filter(portfolio=portfolio)

    def list_public_skills_for_portfolio(self, portfolio):
        # Assuming skills are always visible if portfolio is public, but since no is_public on skill, return all for now
        return self.list_skills_for_portfolio(portfolio)

    def create_skill(self, *, portfolio, data):
        return models.Skill.objects.create(
            portfolio=portfolio,
            name=data["name"],
            proficiency_level=data["proficiency_level"],
            years_of_experience=data["years_of_experience"],
            skill_certification=data.get("skill_certification")
        )

    def update_skill(self, *, skill, data):
        for field, value in data.items():
            setattr(skill, field, value)
        skill.save()
        return skill

    def delete_skill(self, *, skill):
        skill.delete()
# endregion

# region: Education Service
class EducationService:
    def get_visible_education_for_user_and_portfolio(self, user, portfolio):
        if user.is_authenticated and user == portfolio.user:
            return self.list_education_for_portfolio(portfolio)
        else:
            return self.list_public_education_for_portfolio(portfolio)

    def list_education_for_portfolio(self, portfolio):
        return models.Education.objects.filter(portfolio=portfolio)

    def list_public_education_for_portfolio(self, portfolio):
        return self.list_education_for_portfolio(portfolio)

    def create_education(self, *, portfolio, data):
        return models.Education.objects.create(
            portfolio=portfolio,
            institution=data["institution"],
            degree=data["degree"],
            start_year=data["start_year"],
            end_year=data.get("end_year")
        )

    def update_education(self, *, education, data):
        for field, value in data.items():
            setattr(education, field, value)
        education.save()
        return education

    def delete_education(self, *, education):
        education.delete()
# endregion

# region: SocialLink Service
class SocialLinkService:
    def get_visible_social_links_for_user_and_portfolio(self, user, portfolio):
        if user.is_authenticated and user == portfolio.user:
            return self.list_social_links_for_portfolio(portfolio)
        else:
            return self.list_public_social_links_for_portfolio(portfolio)

    def list_social_links_for_portfolio(self, portfolio):
        return models.SocialLink.objects.filter(portfolio=portfolio)

    def list_public_social_links_for_portfolio(self, portfolio):
        return self.list_social_links_for_portfolio(portfolio)

    def create_social_link(self, *, portfolio, data):
        return models.SocialLink.objects.create(
            portfolio=portfolio,
            platform=data["platform"],
            url=data["url"]
        )

    def update_social_link(self, *, social_link, data):
        for field, value in data.items():
            setattr(social_link, field, value)
        social_link.save()
        return social_link

    def delete_social_link(self, *, social_link):
        social_link.delete()
# endregion

# region: Document Service
class DocumentService:
    def get_visible_documents_for_user_and_portfolio(self, user, portfolio):
        if user.is_authenticated and user == portfolio.user:
            return self.list_documents_for_portfolio(portfolio)
        else:
            return self.list_public_documents_for_portfolio(portfolio)

    def list_documents_for_portfolio(self, portfolio):
        return models.Document.objects.filter(portfolio=portfolio)

    def list_public_documents_for_portfolio(self, portfolio):
        return models.Document.objects.filter(portfolio=portfolio, is_public=True)

    def create_document(self, *, portfolio, data):
        # Business rule: only one resume per portfolio
        if data.get("doc_type") == models.Document.DocumentType.RESUME and models.Document.objects.filter(portfolio=portfolio, doc_type=models.Document.DocumentType.RESUME).exists():
            raise ValidationError("Only one resume allowed per portfolio")
        return models.Document.objects.create(
            portfolio=portfolio,
            file=data["file"],
            doc_type=data["doc_type"],
            is_public=data.get("is_public", False)
        )

    def update_document(self, *, document, data):
        for field, value in data.items():
            setattr(document, field, value)
        document.save()
        return document

    def delete_document(self, *, document):
        document.delete()
# endregion

class PortfolioService:
    def log_profile_view(self, *, viewer, portfolio, ip_address=None):
        """
        Logs a profile view event. Viewer can be None (anonymous).
        Only logs if viewer is not the portfolio owner.
        """
        if viewer.is_authenticated and viewer == portfolio.user:
            return 
        models.ProfileView.objects.create(
            viewer=viewer if viewer.is_authenticated else None,
            portfolio=portfolio,
            ip_address=ip_address
        )

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
            raise ValidationError("Portfolio already exists for this user")

        is_published = data.get("is_published", False)
        is_public = data.get("is_public", False)

        # Domain invariant enforcement
        if is_public and not is_published:
            raise ValueError("Portfolio cannot be public unless it is published")

        portfolio = models.Portfolio.objects.create(
            user=user,
            title=data["title"],
            summary=data.get("summary", ""),
            is_published=is_published,
            is_public=is_public,
        )

        return portfolio

    def update_portfolio(self, *, portfolio, data):
        for field, value in data.items():
            # ensure we only set fields that exist on the model
            if hasattr(portfolio, field):
                if field == "is_public" and value:
                    if not data.get("is_published", portfolio.is_published):
                        raise ValidationError("Portfolio cannot be public unless it is published")
                setattr(portfolio, field, value)
        portfolio.save()
        return portfolio

    def delete_portfolio(self, *, portfolio):
        portfolio.delete()


        