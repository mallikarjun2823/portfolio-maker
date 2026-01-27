from django.contrib import admin
from . import models

# region: Admin Registration
admin.site.register(models.ActivityLog)
admin.site.register(models.Portfolio)
admin.site.register(models.Education)
admin.site.register(models.UserProfile)
admin.site.register(models.Project)
admin.site.register(models.Skill)
admin.site.register(models.SocialLink)
admin.site.register(models.ProfileView)
admin.site.register(models.Document)
# endregion
