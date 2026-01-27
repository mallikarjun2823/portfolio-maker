from django.urls import path
from . import views

# region: URL Patterns
urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),

    # Portfolio-scoped project routes
    path('portfolio/<int:portfolio_id>/projects/', views.ProjectListCreateView.as_view(), name='project-list-create'),
    path('portfolio/<int:portfolio_id>/projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    # Portfolio CRUD
    path('portfolios/', views.PortfolioView.as_view(), name='portfolio-list-create'),
    path('portfolios/<int:pk>/', views.PortfolioDetailView.as_view(), name='portfolio-detail'),
]
# endregion