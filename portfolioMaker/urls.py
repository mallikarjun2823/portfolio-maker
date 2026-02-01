"""
URL configuration for portfolioMaker project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings

# Root URL configuration uses an API-first prefix and delegates app routes to the
# `portfolio` app. This keeps URL surface predictable and consistent for clients.
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('portfolioMaker.portfolio.urls')),
    path('api/auth/', include('rest_framework.urls')),  # browsable-auth endpoints
]

if settings.DEBUG:
    import debug_toolbar

    # Keep debug toolbar under a clearly marked debug path and only enabled
    # in DEBUG mode so it cannot be triggered in production.
    urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns
