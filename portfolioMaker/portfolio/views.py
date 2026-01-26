import logging
logger = logging.getLogger(__name__)

from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny,IsAuthenticated
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from django.shortcuts import render
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from . import serializers
from .services import ProjectService
from .permissions import IsOwner
from . import models
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

class ProjectListCreateView(GenericAPIView):
    serializer_class = serializers.ProjectSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        service = ProjectService()
        projects = service.list_public_projects()
        serializer = self.get_serializer(projects, many=True)
        logger.info(f"ProjectListCreateView: Fetched {len(serializer.data)} projects")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        portfolio = request.user.portfolio
        service = ProjectService()
        project = service.create_project(
            portfolio=portfolio,
            data=serializer.validated_data
        )

        output_serializer = self.get_serializer(project)
        logger.info(f"Project created: id={project.id} title={project.title} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)    

class ProjectDetailView(GenericAPIView):
    serializer_class = serializers.ProjectSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsOwner()]

    def get_object(self):
        service = ProjectService()
        return service.get_project_by_id(self.kwargs["pk"])

    def get(self, request, pk):
        project = self.get_object()
        serializer = self.get_serializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
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
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        project = self.get_object()
        service = ProjectService()
        service.delete_project(project)
        return Response(status=status.HTTP_204_NO_CONTENT)
