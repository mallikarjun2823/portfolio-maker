from . import models
from urllib.parse import urlparse
from django.db.models import Q, Max
from rest_framework.exceptions import ValidationError
from django.db import connection, transaction
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
        return models.Project.objects.filter(status=models.ItemStatus.PUBLISHED)

    def list_projects_for_user(self, user):
        return models.Project.objects.filter(
            portfolio__user=user
        )

    def list_projects_for_portfolio(self, portfolio):
        return models.Project.objects.filter(portfolio=portfolio)

    def list_public_projects_for_portfolio(self, portfolio):
        return models.Project.objects.filter(portfolio=portfolio, status=models.ItemStatus.PUBLISHED)

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

    def create_project(self, *, portfolio, data, user=None):
        """
        Create a project with business rule enforcement:
        - Portfolio must not be ARCHIVED
        - New items start in DRAFT
        """
        portfolio_service = PortfolioService()
        if portfolio.status == models.PortfolioStatus.ARCHIVED:
            raise ValidationError("Cannot add items to an archived portfolio")
        
        project = models.Project.objects.create(
            portfolio=portfolio,
            title=data["title"],
            description=data["description"],
            tech_stack=data["tech_stack"],
            project_url=data.get("project_url", ""),
            status=models.ItemStatus.DRAFT
        )
        
        # Log activity
        if user:
            portfolio_service._log_activity(
                user=user,
                action="CREATE",
                entity_type="Project",
                entity_id=project.id
            )
        
        return project

    def update_project(self, *, project, data, user=None):
        """
        Update a project with business rules:
        - Cannot update if portfolio is ARCHIVED
        - Auto-revert to DRAFT if item was modified and portfolio is not archived
        """
        portfolio_service = PortfolioService()
        
        if project.portfolio.status == models.PortfolioStatus.ARCHIVED:
            raise ValidationError("Cannot modify items in an archived portfolio")
        
        for field, value in data.items():
            if field != 'status':  # Don't allow direct status changes via update
                setattr(project, field, value)
        
        # Auto-revert to DRAFT if not already published
        if project.status == models.ItemStatus.PUBLISHED:
            project.status = models.ItemStatus.DRAFT
        
        project.save()
        
        # Log activity
        if user:
            portfolio_service._log_activity(
                user=user,
                action="UPDATE",
                entity_type="Project",
                entity_id=project.id
            )
        
        return project

    def publish_project(self, *, project, user):
        """Publish a project with validation"""
        portfolio_service = PortfolioService()
        portfolio_service.publish_item(
            item=project,
            portfolio=project.portfolio,
            user=user,
            model_type="Project"
        )

    def delete_project(self, *, project, user=None):
        """Delete project with restrictions"""
        if project.portfolio.status == models.PortfolioStatus.PUBLISHED:
            raise ValidationError("Cannot delete items from a published portfolio")
        
        portfolio_service = PortfolioService()
        project_id = project.id
        project.delete()
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="DELETE",
                entity_type="Project",
                entity_id=project_id
            )
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
        return models.Skill.objects.filter(portfolio=portfolio, status=models.ItemStatus.PUBLISHED)

    def create_skill(self, *, portfolio, data, user=None):
        """
        Create a skill with business rule enforcement:
        - Portfolio must not be ARCHIVED
        - New items start in DRAFT
        """
        portfolio_service = PortfolioService()
        
        if portfolio.status == models.PortfolioStatus.ARCHIVED:
            raise ValidationError("Cannot add items to an archived portfolio")
        
        skill = models.Skill.objects.create(
            portfolio=portfolio,
            name=data["name"],
            proficiency_level=data["proficiency_level"],
            years_of_experience=data["years_of_experience"],
            skill_certification=data.get("skill_certification"),
            status=models.ItemStatus.DRAFT
        )
        
        # Log activity
        if user:
            portfolio_service._log_activity(
                user=user,
                action="CREATE",
                entity_type="Skill",
                entity_id=skill.id
            )
        
        return skill

    def update_skill(self, *, skill, data, user=None):
        """Update a skill with business rules"""
        portfolio_service = PortfolioService()
        
        if skill.portfolio.status == models.PortfolioStatus.ARCHIVED:
            raise ValidationError("Cannot modify items in an archived portfolio")
        
        for field, value in data.items():
            if field != 'status':
                setattr(skill, field, value)
        
        if skill.status == models.ItemStatus.PUBLISHED:
            skill.status = models.ItemStatus.DRAFT
        
        skill.save()
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="UPDATE",
                entity_type="Skill",
                entity_id=skill.id
            )
        
        return skill

    def publish_skill(self, *, skill, user):
        """Publish a skill with validation"""
        portfolio_service = PortfolioService()
        portfolio_service.publish_item(
            item=skill,
            portfolio=skill.portfolio,
            user=user,
            model_type="Skill"
        )

    def delete_skill(self, *, skill, user=None):
        """Delete skill with restrictions"""
        if skill.portfolio.status == models.PortfolioStatus.PUBLISHED:
            raise ValidationError("Cannot delete items from a published portfolio")
        
        portfolio_service = PortfolioService()
        skill_id = skill.id
        skill.delete()
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="DELETE",
                entity_type="Skill",
                entity_id=skill_id
            )
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
        return models.Education.objects.filter(portfolio=portfolio, status=models.ItemStatus.PUBLISHED)

    def create_education(self, *, portfolio, data, user=None):
        """Create an education entry with business rules"""
        portfolio_service = PortfolioService()
        
        if portfolio.status == models.PortfolioStatus.ARCHIVED:
            raise ValidationError("Cannot add items to an archived portfolio")
        
        education = models.Education.objects.create(
            portfolio=portfolio,
            institution=data["institution"],
            degree=data["degree"],
            start_year=data["start_year"],
            end_year=data.get("end_year"),
            status=models.ItemStatus.DRAFT
        )
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="CREATE",
                entity_type="Education",
                entity_id=education.id
            )
        
        return education

    def update_education(self, *, education, data, user=None):
        """Update education with business rules"""
        portfolio_service = PortfolioService()
        
        if education.portfolio.status == models.PortfolioStatus.ARCHIVED:
            raise ValidationError("Cannot modify items in an archived portfolio")
        
        for field, value in data.items():
            if field != 'status':
                setattr(education, field, value)
        
        if education.status == models.ItemStatus.PUBLISHED:
            education.status = models.ItemStatus.DRAFT
        
        education.save()
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="UPDATE",
                entity_type="Education",
                entity_id=education.id
            )
        
        return education

    def publish_education(self, *, education, user):
        """Publish education with validation"""
        portfolio_service = PortfolioService()
        portfolio_service.publish_item(
            item=education,
            portfolio=education.portfolio,
            user=user,
            model_type="Education"
        )

    def delete_education(self, *, education, user=None):
        """Delete education with restrictions"""
        if education.portfolio.status == models.PortfolioStatus.PUBLISHED:
            raise ValidationError("Cannot delete items from a published portfolio")
        
        portfolio_service = PortfolioService()
        education_id = education.id
        education.delete()
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="DELETE",
                entity_type="Education",
                entity_id=education_id
            )
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
        return models.SocialLink.objects.filter(portfolio=portfolio, status=models.ItemStatus.PUBLISHED)

    def create_social_link(self, *, portfolio, data, user=None):
        """Create a social link with business rules"""
        portfolio_service = PortfolioService()
        
        if portfolio.status == models.PortfolioStatus.ARCHIVED:
            raise ValidationError("Cannot add items to an archived portfolio")
        
        social_link = models.SocialLink.objects.create(
            portfolio=portfolio,
            platform=data["platform"],
            url=data["url"],
            status=models.ItemStatus.DRAFT
        )
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="CREATE",
                entity_type="SocialLink",
                entity_id=social_link.id
            )
        
        return social_link

# region: Profile Service
class ProfileService:
    """Handles operations around the UserProfile and related User updates.

    All DB access for profile CRUD should go through this service to respect
    architectural boundaries.
    """
    def get_or_create_profile(self, user):
        profile, created = models.UserProfile.objects.get_or_create(user=user)
        return profile

    def update_profile(self, user, data, avatar_file=None):
        """Apply updates to the user's profile and user record.

        `data` is expected to be the serializer.validated_data mapping which
        may contain a nested `user` dict with `username` and `email`, plus
        `bio` at top-level.
        """
        profile = self.get_or_create_profile(user)

        # Update user fields if provided
        user_data = data.get('user', {})
        username = user_data.get('username')
        email = user_data.get('email')
        if username is not None and username != user.username:
            user.username = username
        if email is not None and email != user.email:
            user.email = email
        user.save()

        # Update profile bio
        if 'bio' in data:
            profile.bio = data.get('bio') or ''

        # Handle avatar file (if present) - caller should pass the uploaded file
        if avatar_file is not None:
            profile.avatar.save(avatar_file.name, avatar_file, save=False)

        profile.save()
        return profile
# endregion

    def update_social_link(self, *, social_link, data, user=None):
        """Update social link with business rules"""
        portfolio_service = PortfolioService()
        
        if social_link.portfolio.status == models.PortfolioStatus.ARCHIVED:
            raise ValidationError("Cannot modify items in an archived portfolio")
        
        for field, value in data.items():
            if field != 'status':
                setattr(social_link, field, value)
        
        if social_link.status == models.ItemStatus.PUBLISHED:
            social_link.status = models.ItemStatus.DRAFT
        
        social_link.save()
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="UPDATE",
                entity_type="SocialLink",
                entity_id=social_link.id
            )
        
        return social_link

    def publish_social_link(self, *, social_link, user):
        """Publish social link with validation"""
        portfolio_service = PortfolioService()
        portfolio_service.publish_item(
            item=social_link,
            portfolio=social_link.portfolio,
            user=user,
            model_type="SocialLink"
        )

    def delete_social_link(self, *, social_link, user=None):
        """Delete social link with restrictions"""
        if social_link.portfolio.status == models.PortfolioStatus.PUBLISHED:
            raise ValidationError("Cannot delete items from a published portfolio")
        
        portfolio_service = PortfolioService()
        social_link_id = social_link.id
        social_link.delete()
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="DELETE",
                entity_type="SocialLink",
                entity_id=social_link_id
            )
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
        return models.Document.objects.filter(portfolio=portfolio, status=models.ItemStatus.PUBLISHED)

    def create_document(self, *, portfolio, data, user=None):
        """
        Create a document with business rules:
        - Only one resume per portfolio
        - Documents start in DRAFT
        - Document type cannot change after creation
        """
        portfolio_service = PortfolioService()
        
        if portfolio.status == models.PortfolioStatus.ARCHIVED:
            raise ValidationError("Cannot add items to an archived portfolio")
        
        if data.get("doc_type") == models.Document.DocumentType.RESUME:
            if models.Document.objects.filter(portfolio=portfolio, doc_type=models.Document.DocumentType.RESUME).exists():
                raise ValidationError("Only one resume allowed per portfolio")
        
        document = models.Document.objects.create(
            portfolio=portfolio,
            file=data["file"],
            doc_type=data["doc_type"],
            status=models.ItemStatus.DRAFT
        )
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="CREATE",
                entity_type="Document",
                entity_id=document.id
            )
        
        return document

    def update_document(self, *, document, data, user=None):
        """
        Update a document with business rules:
        - Cannot change doc_type after upload
        - Cannot update if portfolio is ARCHIVED
        """
        portfolio_service = PortfolioService()
        
        if document.portfolio.status == models.PortfolioStatus.ARCHIVED:
            raise ValidationError("Cannot modify items in an archived portfolio")
        
        for field, value in data.items():
            if field == 'doc_type':
                raise ValidationError("Cannot change document type after upload")
            if field != 'status':
                setattr(document, field, value)
        
        if document.status == models.ItemStatus.PUBLISHED:
            document.status = models.ItemStatus.DRAFT
        
        document.save()
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="UPDATE",
                entity_type="Document",
                entity_id=document.id
            )
        
        return document

    def publish_document(self, *, document, user):
        """Publish document with validation"""
        portfolio_service = PortfolioService()
        portfolio_service.publish_item(
            item=document,
            portfolio=document.portfolio,
            user=user,
            model_type="Document"
        )

    def delete_document(self, *, document, user=None):
        """
        Delete document with restrictions:
        - Cannot delete if portfolio is PUBLISHED
        """
        if document.portfolio.status == models.PortfolioStatus.PUBLISHED:
            raise ValidationError("Cannot delete documents from a published portfolio")
        
        portfolio_service = PortfolioService()
        document_id = document.id
        document.delete()
        
        if user:
            portfolio_service._log_activity(
                user=user,
                action="DELETE",
                entity_type="Document",
                entity_id=document_id
            )
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
                Q(status=models.PortfolioStatus.PUBLISHED) | Q(user=viewer)
            )
        return models.Portfolio.objects.filter(status=models.PortfolioStatus.PUBLISHED)

    def create_portfolio(self, *, user, data):
        """
        Business rules:
        - A user can have only one portfolio
        - A portfolio cannot be public unless it is published
        """

        # Optional but recommended: one-portfolio-per-user rule
        if models.Portfolio.objects.filter(user=user).exists():
            raise ValidationError("Portfolio already exists for this user")

        status = data.get("status", models.PortfolioStatus.DRAFT)

        portfolio = models.Portfolio.objects.create(
            user=user,
            title=data["title"],
            summary=data.get("summary", ""),
            status=status,
        )

        return portfolio

    def update_portfolio(self, *, portfolio, data):
        for field, value in data.items():
            # ensure we only set fields that exist on the model
            if hasattr(portfolio, field):
                setattr(portfolio, field, value)
        portfolio.save()
        
        # Auto-create version snapshot on update
        if portfolio.status == models.PortfolioStatus.PUBLISHED:
            self.create_version_snapshot(
                portfolio=portfolio,
                user=portfolio.user,
                change_note="Auto-snapshot on update"
            )
        
        return portfolio

    def delete_portfolio(self, *, portfolio):
        portfolio.delete()

    # === Portfolio Status Transitions & Publishing ===#
    def _can_transition_status(self, current_status, new_status):
        """
        Enforce status transition rules: DRAFT → REVIEW → PUBLISHED → ARCHIVED only
        """
        valid_transitions = {
            models.PortfolioStatus.DRAFT: [models.PortfolioStatus.REVIEW],
            models.PortfolioStatus.REVIEW: [models.PortfolioStatus.PUBLISHED, models.PortfolioStatus.DRAFT],
            models.PortfolioStatus.PUBLISHED: [models.PortfolioStatus.ARCHIVED],
            models.PortfolioStatus.ARCHIVED: [],  # No transitions from ARCHIVED
        }
        return new_status in valid_transitions.get(current_status, [])

    def _check_publish_requirements(self, portfolio):
        """
        Validate publishing requirements:
        - At least one published project
        - At least one published skill
        """
        published_projects = models.Project.objects.filter(
            portfolio=portfolio,
            status=models.ItemStatus.PUBLISHED
        ).exists()
        
        published_skills = models.Skill.objects.filter(
            portfolio=portfolio,
            status=models.ItemStatus.PUBLISHED
        ).exists()
        
        if not published_projects:
            raise ValidationError("Portfolio must have at least one published project before publishing.")
        if not published_skills:
            raise ValidationError("Portfolio must have at least one published skill before publishing.")

    def transition_portfolio_status(self, *, portfolio, new_status, user):
        """
        Transition portfolio status with validation.
        Enforces business rules and creates activity logs.
        """
        if not self._can_transition_status(portfolio.status, new_status):
            raise ValidationError(
                f"Invalid status transition from {portfolio.status} to {new_status}. "
                f"Allowed transitions: {models.PortfolioStatus.DRAFT} → {models.PortfolioStatus.REVIEW} → "
                f"{models.PortfolioStatus.PUBLISHED} → {models.PortfolioStatus.ARCHIVED}"
            )

        # Check publishing requirements
        if new_status == models.PortfolioStatus.PUBLISHED:
            self._check_publish_requirements(portfolio)

        old_status = portfolio.status
        portfolio.status = new_status
        portfolio.save()

        # Log activity
        self._log_activity(
            user=user,
            action="PUBLISH" if new_status == models.PortfolioStatus.PUBLISHED else "UPDATE",
            entity_type="Portfolio",
            entity_id=portfolio.id
        )

        # Create version snapshot on state change
        if new_status == models.PortfolioStatus.PUBLISHED:
            self.create_version_snapshot(
                portfolio=portfolio,
                user=user,
                change_note=f"Auto-snapshot on publishing from {old_status}"
            )

        # Cascade archiving if moving to ARCHIVED
        if new_status == models.PortfolioStatus.ARCHIVED:
            self._archive_all_items(portfolio=portfolio, user=user)

        return portfolio

    def _archive_all_items(self, *, portfolio, user):
        """
        When portfolio is archived, force all items to ARCHIVED.
        """
        for model_class in [models.Project, models.Skill, models.Education, models.Document, models.SocialLink]:
            model_class.objects.filter(portfolio=portfolio).update(status=models.ItemStatus.ARCHIVED)

    def _log_activity(self, *, user, action, entity_type, entity_id):
        """
        Log significant actions. Append-only, never edited or deleted.
        """
        models.ActivityLog.objects.create(
            user=user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id
        )

    # === Item Publishing Validation ===#
    def can_publish_item(self, *, item, portfolio):
        """
        Check if item can be published:
        - Portfolio must be PUBLISHED
        - Item status must be DRAFT
        """
        if portfolio.status != models.PortfolioStatus.PUBLISHED:
            raise ValidationError(
                f"Cannot publish item. Portfolio must be PUBLISHED (current: {portfolio.status})"
            )
        if item.status != models.ItemStatus.DRAFT:
            raise ValidationError(
                f"Cannot publish item. Item must be in DRAFT status (current: {item.status})"
            )

    def publish_item(self, *, item, portfolio, user, model_type):
        """
        Publish an item and log the activity.
        """
        self.can_publish_item(item=item, portfolio=portfolio)
        item.status = models.ItemStatus.PUBLISHED
        item.save()
        
        portfolio.updated_at = timezone.now()
        portfolio.save()

        self._log_activity(
            user=user,
            action="PUBLISH",
            entity_type=model_type,
            entity_id=item.id
        )

    def revert_item_to_draft(self, *, item, portfolio):
        """
        Auto-revert item to DRAFT if portfolio is not archived and item was modified.
        """
        if portfolio.status != models.PortfolioStatus.ARCHIVED:
            item.status = models.ItemStatus.DRAFT
            item.save()

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
            status=portfolio.status,
            created_by=user,
            change_note=change_note,
            is_draft=is_draft
        )

        # capture related items as a JSON snapshot (non-file fields)
        try:
            projects = list(models.Project.objects.filter(portfolio=portfolio).values(
                'title', 'description', 'tech_stack', 'project_url', 'status'
            ))
            skills = list(models.Skill.objects.filter(portfolio=portfolio).values(
                'name', 'proficiency_level', 'years_of_experience', 'skill_certification', 'status'
            ))
            education = list(models.Education.objects.filter(portfolio=portfolio).values(
                'institution', 'degree', 'start_year', 'end_year', 'status'
            ))
            social_links = list(models.SocialLink.objects.filter(portfolio=portfolio).values(
                'platform', 'url', 'status'
            ))
            # document files cannot be reliably serialized/restored; include metadata only
            documents = list(models.Document.objects.filter(portfolio=portfolio).values(
                'doc_type', 'status', 'file'
            ))

            items_snapshot = {
                'projects': projects,
                'skills': skills,
                'education': education,
                'social_links': social_links,
                'documents': documents,
            }
            version.items_snapshot = items_snapshot
            version.save()
        except Exception:
            # best-effort: if snapshotting related items fails, keep the version without items
            pass

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

        # Apply version data and restore related items if available
        with transaction.atomic():
            portfolio.title = version.title
            portfolio.summary = version.summary
            portfolio.status = version.status
            portfolio.save()

            snapshot = getattr(version, 'items_snapshot', None)
            if snapshot:
                # Restore projects
                if 'projects' in snapshot:
                    models.Project.objects.filter(portfolio=portfolio).delete()
                    for p in snapshot.get('projects', []):
                        proj = models.Project.objects.create(
                            portfolio=portfolio,
                            title=p.get('title') or '',
                            description=p.get('description') or '',
                            tech_stack=p.get('tech_stack') or '',
                            project_url=p.get('project_url') or '',
                            status=p.get('status', models.ItemStatus.DRAFT)
                        )
                        self._log_activity(user=user, action='CREATE', entity_type='Project', entity_id=proj.id)

                # Restore skills
                if 'skills' in snapshot:
                    models.Skill.objects.filter(portfolio=portfolio).delete()
                    for s in snapshot.get('skills', []):
                        skill = models.Skill.objects.create(
                            portfolio=portfolio,
                            name=s.get('name') or '',
                            proficiency_level=s.get('proficiency_level') or models.ProficiencyLevel.BEGINNER,
                            years_of_experience=s.get('years_of_experience') or 0,
                            skill_certification=s.get('skill_certification') or None,
                            status=s.get('status', models.ItemStatus.DRAFT)
                        )
                        self._log_activity(user=user, action='CREATE', entity_type='Skill', entity_id=skill.id)

                # Restore education
                if 'education' in snapshot:
                    models.Education.objects.filter(portfolio=portfolio).delete()
                    for e in snapshot.get('education', []):
                        edu = models.Education.objects.create(
                            portfolio=portfolio,
                            institution=e.get('institution') or '',
                            degree=e.get('degree') or '',
                            start_year=e.get('start_year') or 0,
                            end_year=e.get('end_year'),
                            status=e.get('status', models.ItemStatus.DRAFT)
                        )
                        self._log_activity(user=user, action='CREATE', entity_type='Education', entity_id=edu.id)

                # Restore social links
                if 'social_links' in snapshot:
                    models.SocialLink.objects.filter(portfolio=portfolio).delete()
                    for sl in snapshot.get('social_links', []):
                        link = models.SocialLink.objects.create(
                            portfolio=portfolio,
                            platform=sl.get('platform') or '',
                            url=sl.get('url') or '',
                            status=sl.get('status', models.ItemStatus.DRAFT)
                        )
                        self._log_activity(user=user, action='CREATE', entity_type='SocialLink', entity_id=link.id)

                # Documents: only metadata was captured (file restoration not supported)
                # Skip deleting/creating Document.file to avoid data loss.
                if 'documents' in snapshot:
                    models.Document.objects.filter(portfolio=portfolio).delete()
                    for d in snapshot.get('documents', []):
                        try:
                            models.Document.objects.create(
                                portfolio=portfolio,
                                doc_type=d.get('doc_type'),
                                status=d.get('status', models.ItemStatus.DRAFT),
                            )
                        except Exception:
                            continue

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