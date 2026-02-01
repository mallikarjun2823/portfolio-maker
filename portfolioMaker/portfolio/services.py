from . import models
from urllib.parse import urlparse
from django.db.models import Q, Max
from rest_framework.exceptions import ValidationError
from django.db import connection
from django.utils import timezone
from datetime import datetime
# region: Project Service
class ProjectService:
    def get_visible_projects_for_user_and_portfolio(self, user, portfolio):
        # Only business logic, no request/serializer
        if user and user.is_authenticated and user == portfolio.user:
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
        if user and user.is_authenticated and user == portfolio.user:
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
        if user and user.is_authenticated and user == portfolio.user:
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
        if user and user.is_authenticated and user == portfolio.user:
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
        if user and user.is_authenticated and user == portfolio.user:
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

# region: Portfolio Service
class PortfolioService:
    def log_profile_view(self, *, viewer, portfolio, ip_address=None):
        """
        Logs a profile view event. Viewer can be None (anonymous).
        Only logs if viewer is not the portfolio owner.
        """
        if viewer and viewer.is_authenticated and viewer == portfolio.user:
            return 
        models.ProfileView.objects.create(
            viewer=viewer if viewer and viewer.is_authenticated else None,
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
            raise ValidationError("Portfolio cannot be public unless it is published")

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
        
        # Auto-create version snapshot on update
        if portfolio.is_published:
            self.create_version_snapshot(
                portfolio=portfolio,
                user=portfolio.user,
                change_note="Auto-snapshot on update"
            )
        
        return portfolio

    def delete_portfolio(self, *, portfolio):
        portfolio.delete()

    # === Portfolio Versioning ===#
    def create_version_snapshot(self, *, portfolio, user, change_note="", is_draft=False):
        """Create an immutable version snapshot of the portfolio"""
        # Get next version number
        max_version = models.PortfolioVersion.objects.filter(portfolio=portfolio).aggregate(
            Max('version_number')
        )['version_number__max']
        next_version = (max_version or 0) + 1
        
        version = models.PortfolioVersion.objects.create(
            portfolio=portfolio,
            version_number=next_version,
            title=portfolio.title,
            summary=portfolio.summary,
            visibility=portfolio.visibility,
            is_published=portfolio.is_published,
            created_by=user,
            change_note=change_note,
            is_draft=is_draft
        )
        return version
    
    def list_versions(self, *, portfolio):
        """List all versions of a portfolio"""
        return models.PortfolioVersion.objects.filter(portfolio=portfolio)
    
    def get_version(self, *, portfolio, version_number):
        """Get a specific version"""
        try:
            return models.PortfolioVersion.objects.get(
                portfolio=portfolio,
                version_number=version_number
            )
        except models.PortfolioVersion.DoesNotExist:
            return None
    
    def revert_to_version(self, *, portfolio, version_number, user):
        """Revert portfolio to a previous version"""
        version = self.get_version(portfolio=portfolio, version_number=version_number)
        if not version:
            raise ValidationError("Version not found")
        
        # Create a snapshot of current state before reverting
        self.create_version_snapshot(
            portfolio=portfolio,
            user=user,
            change_note=f"Auto-snapshot before reverting to v{version_number}"
        )
        
        # Apply version data
        portfolio.title = version.title
        portfolio.summary = version.summary
        portfolio.visibility = version.visibility
        portfolio.is_published = version.is_published
        portfolio.save()
        
        # Create new version for the revert
        self.create_version_snapshot(
            portfolio=portfolio,
            user=user,
            change_note=f"Reverted to v{version_number}"
        )
        
        return portfolio

    # === Analytics (read-only, raw SQL) ===
    SUPPORTED_GROUPS = ('day', 'week', 'month')
    SUPPORTED_METRICS = ('count', 'unique_count')

    def _group_expr(self, group_by, vendor):
        if vendor == 'sqlite':
            if group_by == 'day':
                return "substr(pv.viewed_at, 1, 10)"
            if group_by == 'week':
                return "date(pv.viewed_at, 'weekday 0', '-6 days')"
            return "substr(pv.viewed_at, 1, 7)"
        elif vendor == 'postgresql':
            if group_by == 'day':
                return "to_char(date_trunc('day', pv.viewed_at), 'YYYY-MM-DD')"
            if group_by == 'week':
                return "to_char(date_trunc('week', pv.viewed_at), 'IYYY-IW')"
            return "to_char(date_trunc('month', pv.viewed_at), 'YYYY-MM')"
        else:
            if group_by == 'day':
                return "DATE_FORMAT(pv.viewed_at, '%Y-%m-%d')"
            if group_by == 'week':
                return "DATE_FORMAT(pv.viewed_at, '%Y-%u')"
            return "DATE_FORMAT(pv.viewed_at, '%Y-%m')"

    def build_time_series_query(self, start_date, end_date, group_by='day', metric='count', entity_type='portfolio', entity_ids=None, limit=None, offset=None):
        if group_by not in self.SUPPORTED_GROUPS:
            raise ValueError('unsupported group_by')
        if metric not in self.SUPPORTED_METRICS:
            raise ValueError('unsupported metric')
        if entity_type not in ('portfolio', 'user'):
            raise ValueError('unsupported entity_type')

        vendor = connection.vendor
        group_label_expr = self._group_expr(group_by, vendor)

        if metric == 'count':
            metric_expr = 'COUNT(*)'
        else:
            metric_expr = "COUNT(DISTINCT COALESCE(pv.viewer_id, pv.ip_address))"

        sql = f"""
SELECT
  {group_label_expr} AS group_label,
  {metric_expr} AS value
FROM portfolio_profileview pv
WHERE pv.viewed_at BETWEEN %s AND %s
"""

        params = [start_date.isoformat(), (end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date))]

        if entity_type == 'portfolio' and entity_ids:
            placeholders = ','.join(['%s'] * len(entity_ids))
            sql += f" AND pv.portfolio_id IN ({placeholders})\n"
            params.extend(entity_ids)
        elif entity_type == 'user' and entity_ids:
            placeholders = ','.join(['%s'] * len(entity_ids))
            sql += f" AND pv.portfolio_id IN (SELECT id FROM portfolio_portfolio WHERE user_id IN ({placeholders}))\n"
            params.extend(entity_ids)

        sql += "GROUP BY group_label ORDER BY group_label ASC\n"

        if limit:
            sql += "LIMIT %s\n"
            params.append(limit)
        if offset:
            sql += "OFFSET %s\n"
            params.append(offset)

        return sql, params

    def execute_query(self, sql, params):
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            cols = [c[0] for c in cursor.description]
            rows = [dict(zip(cols, row)) for row in cursor.fetchall()]
        return rows

    def get_time_series(self, *, start_date, end_date, group_by='day', metric='count', entity_type='portfolio', entity_ids=None, limit=None, offset=None):
        sql, params = self.build_time_series_query(start_date=start_date, end_date=end_date, group_by=group_by, metric=metric, entity_type=entity_type, entity_ids=entity_ids, limit=limit, offset=offset)
        rows = self.execute_query(sql, params)
        labels = [r['group_label'] for r in rows]
        values = [int(r['value']) for r in rows]
        return {
            'labels': labels,
            'values': values,
            'rows': rows,
        }
# endregion