from django.urls import path
from . import views
urlpatterns = [
    path('', views.ProjectListCreateView.as_view(), name='project-list-create'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
]
