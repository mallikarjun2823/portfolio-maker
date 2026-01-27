# region: Imports
import logging
logger = logging.getLogger(__name__)

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from django.shortcuts import get_object_or_404
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from . import serializers
from .services import PortfolioService, ProjectService
from .permissions import IsProjectOwner, IsPortfolioOwner
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
        return [IsAuthenticated(), IsPortfolioOwner()]
    def get(self, request, portfolio_id):
        service = ProjectService()
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        projects = service.get_visible_projects_for_user_and_portfolio(user=request.user, portfolio=portfolio)
        serializer = self.get_serializer(projects, many=True)
        logger.info(f"ProjectListCreateView: Fetched {len(serializer.data)} projects for portfolio={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, portfolio_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        # Permission check: IsPortfolioOwner
        self.check_object_permissions(request, portfolio)
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
        return [IsAuthenticated(), IsProjectOwner()]
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
        self.check_object_permissions(request, project)
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
        self.check_object_permissions(request, project)
        project_id = project.id
        service = ProjectService()
        service.delete_project(project=project)
        logger.info(f"Project deleted: id={project_id} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)

# endregion

class PortfolioView(GenericAPIView):
    serializer_class = serializers.PortfolioSerializer
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get(self, request):
        service = PortfolioService()
        portfolios = service.visible_to_user(
            viewer=request.user
        )
        serializer = self.get_serializer(portfolios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service = PortfolioService()
        portfolio = service.create_portfolio(
            user=request.user,
            data=serializer.validated_data
        )
        output_serializer = self.get_serializer(portfolio)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class PortfolioDetailView(GenericAPIView):
    serializer_class = serializers.PortfolioSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsPortfolioOwner()]

    def get_object(self):
        pk = self.kwargs.get('pk')
        return get_object_or_404(models.Portfolio, id=pk)

    def get(self, request, pk):
        portfolio = self.get_object()
        serializer = self.get_serializer(portfolio)
        logger.info(f"Portfolio retrieved: id={portfolio.id} user_id={portfolio.user.id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        portfolio = self.get_object()
        self.check_object_permissions(request, portfolio)
        serializer = self.get_serializer(instance=portfolio, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = PortfolioService()
        updated = service.update_portfolio(portfolio=portfolio, data=serializer.validated_data)
        output_serializer = self.get_serializer(updated)
        logger.info(f"Portfolio updated: id={updated.id} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        portfolio = self.get_object()
        self.check_object_permissions(request, portfolio)
        portfolio_id = portfolio.id
        service = PortfolioService()
        service.delete_portfolio(portfolio=portfolio)
        logger.info(f"Portfolio deleted: id={portfolio_id} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)