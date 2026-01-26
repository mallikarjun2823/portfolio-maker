# region: Imports
import logging
logger = logging.getLogger(__name__)

from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny,IsAuthenticated
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from django.shortcuts import get_object_or_404, render
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from . import serializers
from .services import ProjectService
from .permissions import IsOwner
from . import models
# endregion

# region: User Authentication Views
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(f"User registered: username={user.username} id={user.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.warning(f"Registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            logger.info(f"User logged in: username={user.username} id={user.id}")
            return Response({
                'token': serializer.validated_data['token'],
                'username': user.username
            }, status=status.HTTP_200_OK)
        logger.warning(f"Login failed for username: {request.data.get('username')}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# endregion

# region: Project Views
class ProjectListCreateView(GenericAPIView):
    serializer_class = serializers.ProjectSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]
    def get(self, request, portfolio_id):
        service = ProjectService()
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)

        # If owner is requesting, show all projects; otherwise only published
        if request.user.is_authenticated and request.user == portfolio.user:
            projects = service.list_projects_for_portfolio(portfolio)
        else:
            projects = service.list_public_projects_for_portfolio(portfolio)

        serializer = self.get_serializer(projects, many=True)
        logger.info(f"ProjectListCreateView: Fetched {len(serializer.data)} projects for portfolio={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, portfolio_id):
        # Only authenticated users can create; ownership is enforced
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        if request.user != portfolio.user:
            return Response({'detail': 'You do not have permission to add projects to this portfolio.'}, status=status.HTTP_403_FORBIDDEN)

        service = ProjectService()
        project = service.create_project(
            portfolio=portfolio,
            data=serializer.validated_data
        )

        output_serializer = self.get_serializer(project)
        logger.info(f"Project created: id={project.id} title={project.title} portfolio_id={portfolio_id} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
# endregion

# region: Project Detail View
class ProjectDetailView(GenericAPIView):
    serializer_class = serializers.ProjectSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsOwner()]
    def get_object(self):
        # expects kwargs to contain 'portfolio_id' and 'pk'
        portfolio_id = self.kwargs.get('portfolio_id')
        pk = self.kwargs.get('pk')
        return get_object_or_404(models.Project, id=pk, portfolio__id=portfolio_id)

    def get(self, request, portfolio_id, pk):
        project = self.get_object()
        serializer = self.get_serializer(project)
        logger.info(f"Project retrieved: id={project.id} title={project.title} portfolio_id={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, portfolio_id, pk):
        project = self.get_object()

        serializer = self.get_serializer(
            instance=project,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)

        service = ProjectService()
        updated_project = service.update_project(
            project=project,
            data=serializer.validated_data
        )

        output_serializer = self.get_serializer(updated_project)
        logger.info(f"Project updated: id={updated_project.id} title={updated_project.title} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, portfolio_id, pk):
        project = self.get_object()
        project_id = project.id
        service = ProjectService()
        service.delete_project(project=project)
        logger.info(f"Project deleted: id={project_id} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)

# endregion