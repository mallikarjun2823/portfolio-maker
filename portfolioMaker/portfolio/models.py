from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ProficiencyLevel(models.TextChoices):
    BEGINNER = "BEGINNER", "Beginner"
    INTERMEDIATE = "INTERMEDIATE", "Intermediate"
    ADVANCED = "ADVANCED", "Advanced"
    EXPERT = "EXPERT", "Expert"


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

class VisibilityChoice(models.TextChoices):
    PRIVATE = "PRIVATE", "Private"
    RECRUITER_ONLY = "RECRUITER_ONLY", "Recruiter Only (Link Share)"
    PUBLIC = "PUBLIC", "Public"

class Portfolio(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="portfolio"
    )

    title = models.CharField(max_length=150)
    summary = models.TextField()

    # Legacy field for backward compatibility
    is_public = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    
    # New visibility system
    visibility = models.CharField(
        max_length=20,
        choices=VisibilityChoice.choices,
        default=VisibilityChoice.PRIVATE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Portfolio"

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

    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

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

    def __str__(self):
        return f"{self.name} ({self.proficiency_level})"


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

    def __str__(self):
        return f"{self.institution} - {self.degree}"

class SocialLink(models.Model):
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="social_links"
    )

    platform = models.CharField(max_length=50)
    url = models.URLField()

    def __str__(self):
        return self.platform

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

    is_public = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.doc_type} - {self.portfolio.user.username}"


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
    visibility = models.CharField(max_length=20)
    is_published = models.BooleanField()
    
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



