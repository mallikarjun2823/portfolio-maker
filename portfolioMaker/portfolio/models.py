# region: Imports
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
# endregion

# region: Choices and Enums
class ProficiencyLevel(models.TextChoices):
    BEGINNER = "BEGINNER", "Beginner"
    INTERMEDIATE = "INTERMEDIATE", "Intermediate"
    ADVANCED = "ADVANCED", "Advanced"
    EXPERT = "EXPERT", "Expert"

# Portfolio status choices
class PortfolioStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    REVIEW = "REVIEW", "In Review"
    PUBLISHED = "PUBLISHED", "Published"
    ARCHIVED = "ARCHIVED", "Archived"

# Item-level status choices (projects, skills, education, documents)
class ItemStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PUBLISHED = "PUBLISHED", "Published"
    ARCHIVED = "ARCHIVED", "Archived"
# endregion

# region: User Profile Model
class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    avatar = models.ImageField(
        upload_to="avatars/",
        null=True,
        blank=True
    )

    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username
# endregion

# region: Portfolio Model
class Portfolio(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="portfolio"
    )

    title = models.CharField(max_length=150)
    summary = models.TextField()

    # Status replaces legacy booleans
    status = models.CharField(
        max_length=20,
        choices=PortfolioStatus.choices,
        default=PortfolioStatus.DRAFT
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Portfolio"
# endregion

# region: Project Model
class Project(models.Model):
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="projects"
    )

    title = models.CharField(max_length=150)
    description = models.TextField()
    tech_stack = models.CharField(max_length=200)
    project_url = models.URLField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=ItemStatus.choices,
        default=ItemStatus.DRAFT
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
# endregion

# region: Skill Model
class Skill(models.Model):
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="skills"
    )

    name = models.CharField(max_length=100)
    proficiency_level = models.CharField(
        max_length=20,
        choices=ProficiencyLevel.choices
    )

    years_of_experience = models.PositiveIntegerField()
    skill_certification = models.FileField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=ItemStatus.choices,
        default=ItemStatus.DRAFT
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.proficiency_level})"
# endregion

# region: Education Model
class Education(models.Model):
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="education"
    )

    institution = models.CharField(max_length=150)
    degree = models.CharField(max_length=100)
    start_year = models.PositiveIntegerField()
    end_year = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=ItemStatus.choices,
        default=ItemStatus.DRAFT
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
# endregion

# region: Social Link Model
class SocialLink(models.Model):
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="social_links"
    )

    platform = models.CharField(max_length=50)
    url = models.URLField()
    status = models.CharField(
        max_length=20,
        choices=ItemStatus.choices,
        default=ItemStatus.DRAFT
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
# endregion

# region: Profile View Model
class ProfileView(models.Model):
    viewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="views_made"
    )

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="views_received"
    )

    viewed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"View on {self.portfolio.user.username}"
# endregion

# region: Activity Log Model
class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
        ("PUBLISH", "Publish"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="activities"
    )

    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=50)
    entity_id = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.action}"
# endregion

# region: Document Model
class Document(models.Model):
    class DocumentType(models.TextChoices):
        RESUME = "resume", "Resume"
        CERTIFICATE = "certificate", "Certificate"
        OTHER = "other", "Other"

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    file = models.FileField(upload_to="documents/")
    doc_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices
    )

    status = models.CharField(
        max_length=20,
        choices=ItemStatus.choices,
        default=ItemStatus.DRAFT
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.doc_type} - {self.portfolio.user.username}"
# endregion

# region: Portfolio Version Model
class PortfolioVersion(models.Model):
    """Immutable version snapshot of a portfolio"""
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="versions"
    )
    
    version_number = models.PositiveIntegerField()
    
    # Snapshot data
    title = models.CharField(max_length=150)
    summary = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=PortfolioStatus.choices,
        default=PortfolioStatus.DRAFT
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="portfolio_versions_created"
    )
    change_note = models.TextField(blank=True)
    is_draft = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-version_number']
        unique_together = ['portfolio', 'version_number']
    
    def __str__(self):
        return f"{self.portfolio.user.username} - v{self.version_number}"
# endregion
