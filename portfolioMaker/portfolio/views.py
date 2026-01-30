# region: Imports
import logging
logger = logging.getLogger(__name__)

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from django.shortcuts import get_object_or_404
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from . import serializers
from .services import PortfolioService, ProjectService, SkillService, EducationService, SocialLinkService, DocumentService
from .permissions import IsPortfolioOwner
from . import models
from django.db import connection


@api_view(['GET'])
@permission_classes([AllowAny])
def debug_portfolio_sql_count(request):
    """
    Development helper: returns portfolios visible to the requester and the number of SQL queries executed.
    Only enabled in DEBUG.
    """
    service = PortfolioService()
    portfolios = service.visible_to_user(viewer=request.user)
    serializer = serializers.PortfolioSerializer(portfolios, many=True)
    return Response({
        'query_count': len(connection.queries),
        'data': serializer.data
    }, status=status.HTTP_200_OK)
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


class PortfolioView(GenericAPIView):
    serializer_class = serializers.PortfolioSerializer
    
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Return portfolios visible to the requesting user.

        This is used by DRF renderers (e.g., Browsable API) which call
        `get_queryset()` when building filter forms and context.
        """
        service = PortfolioService()
        return service.visible_to_user(viewer=self.request.user)
    
    def get(self, request):
        # Use the same queryset as get_queryset to keep behavior consistent
        portfolios = self.get_queryset()
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
        # Log profile view
        ip_address = request.META.get("REMOTE_ADDR")
        service = PortfolioService()
        service.log_profile_view(viewer=request.user, portfolio=portfolio, ip_address=ip_address)
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
        return [IsAuthenticated(), IsPortfolioOwner()]
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
        portfolio = project.portfolio
        self.check_object_permissions(request, portfolio)
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
        portfolio = project.portfolio
        self.check_object_permissions(request, portfolio)
        project_id = project.id
        service = ProjectService()
        service.delete_project(project=project)
        logger.info(f"Project deleted: id={project_id} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)

# endregion

# region: Skill Views
class SkillListCreateView(GenericAPIView):
    serializer_class = serializers.SkillSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsPortfolioOwner()]

    def get(self, request, portfolio_id):
        service = SkillService()
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        skills = service.get_visible_skills_for_user_and_portfolio(user=request.user, portfolio=portfolio)
        serializer = self.get_serializer(skills, many=True)
        logger.info(f"SkillListCreateView: Fetched {len(serializer.data)} skills for portfolio={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, portfolio_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        self.check_object_permissions(request, portfolio)
        service = SkillService()
        skill = service.create_skill(
            portfolio=portfolio,
            data=serializer.validated_data
        )
        output_serializer = self.get_serializer(skill)
        logger.info(f"Skill created: id={skill.id} name={skill.name} portfolio_id={portfolio_id} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

class SkillDetailView(GenericAPIView):
    serializer_class = serializers.SkillSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsPortfolioOwner()]

    def get_object(self):
        portfolio_id = self.kwargs.get('portfolio_id')
        pk = self.kwargs.get('pk')
        return get_object_or_404(models.Skill, id=pk, portfolio__id=portfolio_id)

    def get(self, request, portfolio_id, pk):
        skill = self.get_object()
        serializer = self.get_serializer(skill)
        logger.info(f"Skill retrieved: id={skill.id} name={skill.name} portfolio_id={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, portfolio_id, pk):
        skill = self.get_object()
        portfolio = skill.portfolio
        self.check_object_permissions(request, portfolio)
        serializer = self.get_serializer(
            instance=skill,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        service = SkillService()
        updated_skill = service.update_skill(
            skill=skill,
            data=serializer.validated_data
        )
        output_serializer = self.get_serializer(updated_skill)
        logger.info(f"Skill updated: id={updated_skill.id} name={updated_skill.name} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, portfolio_id, pk):
        skill = self.get_object()
        portfolio = skill.portfolio
        self.check_object_permissions(request, portfolio)
        skill_id = skill.id
        service = SkillService()
        service.delete_skill(skill=skill)
        logger.info(f"Skill deleted: id={skill_id} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)
# endregion

# region: Education Views
class EducationListCreateView(GenericAPIView):
    serializer_class = serializers.EducationSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsPortfolioOwner()]

    def get(self, request, portfolio_id):
        service = EducationService()
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        education = service.get_visible_education_for_user_and_portfolio(user=request.user, portfolio=portfolio)
        serializer = self.get_serializer(education, many=True)
        logger.info(f"EducationListCreateView: Fetched {len(serializer.data)} education for portfolio={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, portfolio_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        self.check_object_permissions(request, portfolio)
        service = EducationService()
        education = service.create_education(
            portfolio=portfolio,
            data=serializer.validated_data
        )
        output_serializer = self.get_serializer(education)
        logger.info(f"Education created: id={education.id} institution={education.institution} portfolio_id={portfolio_id} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

class EducationDetailView(GenericAPIView):
    serializer_class = serializers.EducationSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsPortfolioOwner()]

    def get_object(self):
        portfolio_id = self.kwargs.get('portfolio_id')
        pk = self.kwargs.get('pk')
        return get_object_or_404(models.Education, id=pk, portfolio__id=portfolio_id)

    def get(self, request, portfolio_id, pk):
        education = self.get_object()
        serializer = self.get_serializer(education)
        logger.info(f"Education retrieved: id={education.id} institution={education.institution} portfolio_id={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, portfolio_id, pk):
        education = self.get_object()
        portfolio = education.portfolio
        self.check_object_permissions(request, portfolio)
        serializer = self.get_serializer(
            instance=education,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        service = EducationService()
        updated_education = service.update_education(
            education=education,
            data=serializer.validated_data
        )
        output_serializer = self.get_serializer(updated_education)
        logger.info(f"Education updated: id={updated_education.id} institution={updated_education.institution} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, portfolio_id, pk):
        education = self.get_object()
        portfolio = education.portfolio
        self.check_object_permissions(request, portfolio)
        education_id = education.id
        service = EducationService()
        service.delete_education(education=education)
        logger.info(f"Education deleted: id={education_id} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)
# endregion

# region: SocialLink Views
class SocialLinkListCreateView(GenericAPIView):
    serializer_class = serializers.SocialLinkSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsPortfolioOwner()]

    def get(self, request, portfolio_id):
        service = SocialLinkService()
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        social_links = service.get_visible_social_links_for_user_and_portfolio(user=request.user, portfolio=portfolio)
        serializer = self.get_serializer(social_links, many=True)
        logger.info(f"SocialLinkListCreateView: Fetched {len(serializer.data)} social links for portfolio={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, portfolio_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        self.check_object_permissions(request, portfolio)
        service = SocialLinkService()
        social_link = service.create_social_link(
            portfolio=portfolio,
            data=serializer.validated_data
        )
        output_serializer = self.get_serializer(social_link)
        logger.info(f"SocialLink created: id={social_link.id} platform={social_link.platform} portfolio_id={portfolio_id} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

class SocialLinkDetailView(GenericAPIView):
    serializer_class = serializers.SocialLinkSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsPortfolioOwner()]

    def get_object(self):
        portfolio_id = self.kwargs.get('portfolio_id')
        pk = self.kwargs.get('pk')
        return get_object_or_404(models.SocialLink, id=pk, portfolio__id=portfolio_id)

    def get(self, request, portfolio_id, pk):
        social_link = self.get_object()
        serializer = self.get_serializer(social_link)
        logger.info(f"SocialLink retrieved: id={social_link.id} platform={social_link.platform} portfolio_id={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, portfolio_id, pk):
        social_link = self.get_object()
        portfolio = social_link.portfolio
        self.check_object_permissions(request, portfolio)
        serializer = self.get_serializer(
            instance=social_link,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        service = SocialLinkService()
        updated_social_link = service.update_social_link(
            social_link=social_link,
            data=serializer.validated_data
        )
        output_serializer = self.get_serializer(updated_social_link)
        logger.info(f"SocialLink updated: id={updated_social_link.id} platform={updated_social_link.platform} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, portfolio_id, pk):
        social_link = self.get_object()
        portfolio = social_link.portfolio
        self.check_object_permissions(request, portfolio)
        social_link_id = social_link.id
        service = SocialLinkService()
        service.delete_social_link(social_link=social_link)
        logger.info(f"SocialLink deleted: id={social_link_id} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)
# endregion

# region: Document Views
class DocumentListCreateView(GenericAPIView):
    serializer_class = serializers.DocumentSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsPortfolioOwner()]

    def get(self, request, portfolio_id):
        service = DocumentService()
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        documents = service.get_visible_documents_for_user_and_portfolio(user=request.user, portfolio=portfolio)
        serializer = self.get_serializer(documents, many=True)
        logger.info(f"DocumentListCreateView: Fetched {len(serializer.data)} documents for portfolio={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, portfolio_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        self.check_object_permissions(request, portfolio)
        service = DocumentService()
        document = service.create_document(
            portfolio=portfolio,
            data=serializer.validated_data
        )
        output_serializer = self.get_serializer(document)
        logger.info(f"Document created: id={document.id} doc_type={document.doc_type} portfolio_id={portfolio_id} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

class DocumentDetailView(GenericAPIView):
    serializer_class = serializers.DocumentSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsPortfolioOwner()]

    def get_object(self):
        portfolio_id = self.kwargs.get('portfolio_id')
        pk = self.kwargs.get('pk')
        return get_object_or_404(models.Document, id=pk, portfolio__id=portfolio_id)

    def get(self, request, portfolio_id, pk):
        document = self.get_object()
        serializer = self.get_serializer(document)
        logger.info(f"Document retrieved: id={document.id} doc_type={document.doc_type} portfolio_id={portfolio_id}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, portfolio_id, pk):
        document = self.get_object()
        portfolio = document.portfolio
        self.check_object_permissions(request, portfolio)
        serializer = self.get_serializer(
            instance=document,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        service = DocumentService()
        updated_document = service.update_document(
            document=document,
            data=serializer.validated_data
        )
        output_serializer = self.get_serializer(updated_document)
        logger.info(f"Document updated: id={updated_document.id} doc_type={updated_document.doc_type} user_id={request.user.id}")
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, portfolio_id, pk):
        document = self.get_object()
        portfolio = document.portfolio
        self.check_object_permissions(request, portfolio)
        document_id = document.id
        service = DocumentService()
        service.delete_document(document=document)
        logger.info(f"Document deleted: id={document_id} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)
# endregion

# region: Portfolio Versioning Views
class PortfolioVersionListView(GenericAPIView):
    serializer_class = serializers.PortfolioVersionSerializer
    permission_classes = [IsAuthenticated, IsPortfolioOwner]

    def get(self, request, portfolio_id):
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        self.check_object_permissions(request, portfolio)
        service = PortfolioService()
        versions = service.list_versions(portfolio=portfolio)
        serializer = self.get_serializer(versions, many=True)
        logger.info(f"Portfolio versions listed: portfolio_id={portfolio_id} count={len(serializer.data)}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, portfolio_id):
        """Create a manual snapshot/draft"""
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        self.check_object_permissions(request, portfolio)
        service = PortfolioService()
        change_note = request.data.get('change_note', '')
        is_draft = request.data.get('is_draft', False)
        version = service.create_version_snapshot(
            portfolio=portfolio,
            user=request.user,
            change_note=change_note,
            is_draft=is_draft
        )
        serializer = self.get_serializer(version)
        logger.info(f"Portfolio version created: portfolio_id={portfolio_id} version={version.version_number}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class PortfolioVersionDetailView(GenericAPIView):
    serializer_class = serializers.PortfolioVersionSerializer
    permission_classes = [IsAuthenticated, IsPortfolioOwner]

    def get(self, request, portfolio_id, version_number):
        portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
        self.check_object_permissions(request, portfolio)
        service = PortfolioService()
        version = service.get_version(portfolio=portfolio, version_number=version_number)
        if not version:
            return Response({"error": "Version not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(version)
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPortfolioOwner])
def revert_portfolio_version(request, portfolio_id, version_number):
    """Revert portfolio to a specific version"""
    portfolio = get_object_or_404(models.Portfolio, id=portfolio_id)
    # Check permissions manually for function-based view
    if portfolio.user != request.user:
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    
    service = PortfolioService()
    try:
        reverted_portfolio = service.revert_to_version(
            portfolio=portfolio,
            version_number=version_number,
            user=request.user
        )
        serializer = serializers.PortfolioSerializer(reverted_portfolio)
        logger.info(f"Portfolio reverted to version: portfolio_id={portfolio_id} version={version_number}")
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
# endregion



