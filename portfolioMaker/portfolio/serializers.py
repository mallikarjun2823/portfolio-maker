from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
import jwt
from datetime import datetime, timedelta
from rest_framework import serializers
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from . import models
from urllib.parse import urlparse

# region: JWT Authentication
class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        try:
            # Extract token from "Bearer <token>"
            token_type, token = auth_header.split(' ')
            if token_type.lower() != 'bearer':
                return None
        except ValueError:
            return None
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            user = User.objects.get(id=user_id)
            return (user, token)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')
# endregion

# region: User Authentication Serializers
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

    def to_representation(self, instance):
        token = self.get_token(instance)
        return {
            'username': instance.username,
            'email': instance.email,
            'token': token
        }

    def get_token(self, user):
        payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(days=1),
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        return token

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if user and user.is_active:
            data['user'] = user
            data['token'] = self.get_token(user)
            return data
        raise serializers.ValidationError('Invalid credentials')

    def get_token(self, user):
        payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(days=1),
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        return token
# endregion

# region: Project Serializers
class ProjectSerializer(serializers.ModelSerializer):
    portfolio = serializers.PrimaryKeyRelatedField(read_only=True)
    is_owner = serializers.SerializerMethodField()

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.portfolio.user == request.user

    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError(
                "Title must be at least 5 characters long."
            )
        return value

    def validate_description(self, value):
        if len(value) < 10:
            raise serializers.ValidationError(
                "Description must be at least 10 characters long."
            )
        return value

    def validate_project_url(self, value):
        if value:
            parsed = urlparse(value)
            if parsed.scheme not in ["http", "https"]:
                raise serializers.ValidationError(
                    "Project URL must start with http or https."
                )
        return value

    class Meta:
        model = models.Project
        fields = [
            'id',
            'portfolio',
            'title',
            'description',
            'tech_stack',
            'project_url',
            'status',
            'created_at',
            'is_owner'
        ]
        read_only_fields = ['id', 'portfolio', 'status', 'created_at', 'is_owner']

class ProjectDetailSerializer(serializers.ModelSerializer):
    portfolio = serializers.PrimaryKeyRelatedField(read_only=True)
    def validate_url(self, value):
        if value:
            parsed = urlparse(value)
            if parsed.scheme not in ["http", "https"]:
                raise serializers.ValidationError(
                    "Project URL must start with http or https."
                )
        return value
    class Meta:
        model = models.Project
        fields = [
            'id',
            'portfolio',
            'title',
            'description',
            'tech_stack',
            'project_url',
            'status',
            'created_at'
        ]
        read_only_fields = ['id', 'portfolio', 'status', 'created_at']

class SkillSerializer(serializers.ModelSerializer):
    portfolio = serializers.PrimaryKeyRelatedField(read_only=True)
    is_owner = serializers.SerializerMethodField()

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.portfolio.user == request.user

    def validate_years_of_experience(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Years of experience cannot be negative."
            )
        return value

    def validate_proficiency_level(self, value):
        if value not in dict(models.ProficiencyLevel.choices):
            raise serializers.ValidationError(
                "Invalid proficiency level."
            )
        return value

    class Meta:
        model = models.Skill
        fields = [
            'id',
            'portfolio',
            'name',
            'proficiency_level',
            'years_of_experience',
            'skill_certification',
            'status',
            'created_at',
            'is_owner'
        ]
        read_only_fields = ['id', 'portfolio', 'status', 'created_at', 'is_owner']
# endregion

# region: Education Serializer
class EducationSerializer(serializers.ModelSerializer):
    portfolio = serializers.PrimaryKeyRelatedField(read_only=True)
    is_owner = serializers.SerializerMethodField()

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.portfolio.user == request.user

    def validate_start_year(self, value):
        if value < 1900 or value > datetime.now().year + 10:
            raise serializers.ValidationError(
                "Invalid start year."
            )
        return value

    def validate_end_year(self, value):
        if value and (value < 1900 or value > datetime.now().year + 10):
            raise serializers.ValidationError(
                "Invalid end year."
            )
        return value

    def validate(self, data):
        start_year = data.get('start_year')
        end_year = data.get('end_year')
        if end_year and start_year and end_year < start_year:
            raise serializers.ValidationError(
                "End year cannot be before start year."
            )
        return data

    class Meta:
        model = models.Education
        fields = [
            'id',
            'portfolio',
            'institution',
            'degree',
            'start_year',
            'end_year',
            'status',
            'created_at',
            'is_owner'
        ]
        read_only_fields = ['id', 'portfolio', 'status', 'created_at', 'is_owner']
# endregion

# region: SocialLink Serializer
class SocialLinkSerializer(serializers.ModelSerializer):
    portfolio = serializers.PrimaryKeyRelatedField(read_only=True)
    is_owner = serializers.SerializerMethodField()

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.portfolio.user == request.user

    def validate_url(self, value):
        parsed = urlparse(value)
        if parsed.scheme not in ["http", "https"]:
            raise serializers.ValidationError(
                "URL must start with http or https."
            )
        return value

    class Meta:
        model = models.SocialLink
        fields = [
            'id',
            'portfolio',
            'platform',
            'url',
            'status',
            'created_at',
            'is_owner'
        ]
        read_only_fields = ['id', 'portfolio', 'status', 'created_at', 'is_owner']
# endregion

# region: Document Serializer
class DocumentSerializer(serializers.ModelSerializer):
    portfolio = serializers.PrimaryKeyRelatedField(read_only=True)
    is_owner = serializers.SerializerMethodField()

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.portfolio.user == request.user

    def validate_doc_type(self, value):
        if value not in dict(models.Document.DocumentType.choices):
            raise serializers.ValidationError(
                "Invalid document type."
            )
        return value

    class Meta:
        model = models.Document
        fields = [
            'id',
            'portfolio',
            'file',
            'doc_type',
            'status',
            'uploaded_at',
            'is_owner'
        ]
        read_only_fields = ['id', 'portfolio', 'uploaded_at', 'status', 'is_owner']
# endregion

# region: Portfolio Versioning Serializers
class PortfolioVersionSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = models.PortfolioVersion
        fields = [
            'id',
            'version_number',
            'title',
            'summary',
            'status',
            'items_snapshot',
            'created_at',
            'created_by',
            'created_by_username',
            'change_note',
            'is_draft'
        ]
        read_only_fields = ['id', 'version_number', 'created_at', 'created_by', 'created_by_username', 'items_snapshot']
# endregion

class PortfolioSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    is_owner = serializers.SerializerMethodField()

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.user == request.user
    
    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError(
                "Title must be at least 5 characters long."
            )
        return value

    def validate_summary(self, value):
        if len(value) < 10:
            raise serializers.ValidationError(
                "Summary must be at least 10 characters long."
            )
        return value
    
    class Meta:
        model = models.Portfolio
        fields = [
            'id',
            'user',
            'title',
            'summary',
            'status',
            'created_at',
            'updated_at',
            'is_owner'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'status', 'is_owner']

# region: UserProfile Serializer
class UserProfileSerializer(serializers.Serializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
    bio = serializers.CharField(allow_blank=True, required=False)
    avatar = serializers.ImageField(required=False, allow_null=True)

    def to_representation(self, instance):
        # instance is UserProfile
        request = self.context.get('request')
        avatar_url = None
        if instance.avatar and hasattr(instance.avatar, 'url'):
            try:
                avatar_url = request.build_absolute_uri(instance.avatar.url) if request else instance.avatar.url
            except Exception:
                avatar_url = instance.avatar.url

        return {
            'username': instance.user.username,
            'email': instance.user.email,
            'bio': instance.bio or '',
            'avatar': avatar_url
        }

    def validate_username(self, value):
        # Do not perform DB access here. Uniqueness checks are enforced
        # by ProfileService.update_profile (per architectural rules).
        if not value:
            raise serializers.ValidationError('Username cannot be empty')
        return value

    def validate_email(self, value):
        # Do not perform DB access here. Uniqueness checks are enforced
        # by ProfileService.update_profile (per architectural rules).
        if not value:
            raise serializers.ValidationError('Email cannot be empty')
        return value

# endregion

# region: Analytics Request Serializer
class AnalyticsRequestSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    group_by = serializers.ChoiceField(choices=[('day', 'day'), ('week', 'week'), ('month', 'month')], required=False)
    entity_type = serializers.ChoiceField(choices=[('portfolio', 'portfolio'), ('user', 'user')], required=False)
    metrics = serializers.ListField(child=serializers.CharField(), required=False)
    entity_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    limit = serializers.IntegerField(required=False, min_value=1)
    offset = serializers.IntegerField(required=False, min_value=0)

    def validate(self, attrs):
        today = timezone.now().date()
        if 'end_date' not in attrs:
            attrs['end_date'] = today
        if 'start_date' not in attrs:
            attrs['start_date'] = today - timezone.timedelta(days=30)
        if 'group_by' not in attrs:
            attrs['group_by'] = 'day'
        if 'entity_type' not in attrs:
            attrs['entity_type'] = 'portfolio'
        if 'metrics' not in attrs or not attrs.get('metrics'):
            attrs['metrics'] = ['count']

        if attrs['start_date'] > attrs['end_date']:
            raise serializers.ValidationError("start_date must be <= end_date")

        supported_metrics = {'count', 'unique_count'}
        for m in attrs['metrics']:
            if m not in supported_metrics:
                raise serializers.ValidationError({ 'metrics': f"unsupported metric '{m}'" })

        if attrs['group_by'] not in ('day', 'week', 'month'):
            raise serializers.ValidationError({ 'group_by': "unsupported group_by; choose day|week|month" })

        if attrs['entity_type'] not in ('portfolio', 'user'):
            raise serializers.ValidationError({ 'entity_type': "unsupported entity_type" })

        return attrs
# endregion
