from django.contrib import admin
from . import models

admin.site.register(models.ActivityLog)
admin.site.register(models.Portfolio)
admin.site.register(models.Education)
admin.site.register(models.Profile)
admin.site.register(models.Project)
admin.site.register(models.Skill)
admin.site.register(models.SocialLink)

# Register your models here.
