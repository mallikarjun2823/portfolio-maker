from django.urls import path
from . import views

# region: URL Patterns (API-first, plural resources)
urlpatterns = [
    # Authentication
    path('auth/register/', views.RegisterView.as_view(), name='auth-register'),
    path('auth/login/', views.LoginView.as_view(), name='auth-login'),

    # Portfolio CRUD
    path('portfolios/', views.PortfolioView.as_view(), name='portfolio-list-create'),
    path('portfolios/<int:pk>/', views.PortfolioDetailView.as_view(), name='portfolio-detail'),

    # Portfolio-scoped project routes
    path('portfolios/<int:portfolio_id>/projects/', views.ProjectListCreateView.as_view(), name='project-list-create'),
    path('portfolios/<int:portfolio_id>/projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),

    # Portfolio-scoped skill routes
    path('portfolios/<int:portfolio_id>/skills/', views.SkillListCreateView.as_view(), name='skill-list-create'),
    path('portfolios/<int:portfolio_id>/skills/<int:pk>/', views.SkillDetailView.as_view(), name='skill-detail'),

    # Portfolio-scoped education routes
    path('portfolios/<int:portfolio_id>/education/', views.EducationListCreateView.as_view(), name='education-list-create'),
    path('portfolios/<int:portfolio_id>/education/<int:pk>/', views.EducationDetailView.as_view(), name='education-detail'),

    # Portfolio-scoped social link routes
    path('portfolios/<int:portfolio_id>/social-links/', views.SocialLinkListCreateView.as_view(), name='social-link-list-create'),
    path('portfolios/<int:portfolio_id>/social-links/<int:pk>/', views.SocialLinkDetailView.as_view(), name='social-link-detail'),

    # Portfolio-scoped document routes
    path('portfolios/<int:portfolio_id>/documents/', views.DocumentListCreateView.as_view(), name='document-list-create'),
    path('portfolios/<int:portfolio_id>/documents/<int:pk>/', views.DocumentDetailView.as_view(), name='document-detail'),

    # Portfolio versioning routes
    path('portfolios/<int:portfolio_id>/versions/', views.PortfolioVersionListView.as_view(), name='portfolio-version-list'),
    path('portfolios/<int:portfolio_id>/versions/<int:version_number>/', views.PortfolioVersionDetailView.as_view(), name='portfolio-version-detail'),
    path('portfolios/<int:portfolio_id>/versions/<int:version_number>/revert/', views.revert_portfolio_version, name='portfolio-version-revert'),

    # Analytics endpoint
    path('analytics/', views.AnalyticsView.as_view(), name='analytics'),

    # Dev debug: returns SQL query count for portfolio listing (DEBUG only handler should guard this view)
    path('debug/queries/', views.debug_portfolio_sql_count, name='debug-queries'),
]
# endregion

# Profile endpoint
urlpatterns += [
    path('me/profile/', views.MyProfileView.as_view(), name='my-profile'),
]