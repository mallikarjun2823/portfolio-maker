from django.db import models
from django.contrib.auth.models import User

class ProficiencyLevel(models.TextChoices):
    BEGINNER = "BEGINNER", "Beginner"
    INTERMEDIATE = "INTERMEDIATE", "Intermediate"
    ADVANCED = "ADVANCED", "Advanced"
    EXPERT = "EXPERT", "Expert"

class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    full_name = models.CharField(max_length=100)
    headline = models.CharField(max_length=150)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name
    
class Portfolio(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="portfolio"
    )
    title = models.CharField(max_length=150)
    summary = models.TextField()
    is_public = models.BooleanField(default=True)
    is_published = models.BooleanField(default=False)

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

