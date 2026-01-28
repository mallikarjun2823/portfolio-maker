from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
import jwt
from datetime import datetime, timedelta
from rest_framework import serializers
from . import models
from urllib.parse import urlparse

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
            'is_published',
            'created_at'
        ]
        read_only_fields = ['id', 'portfolio', 'is_published', 'created_at']


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
            'is_published',
            'created_at'
        ]
        read_only_fields = ['id', 'portfolio', 'created_at']

class SkillSerializer(serializers.ModelSerializer):

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
            'name',
            'proficiency_level',
            'years_of_experience',
            'skill_certification'
        ]
        read_only_fields = ['id']
# endregion

# region: Education Serializer
class EducationSerializer(serializers.ModelSerializer):

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
            'institution',
            'degree',
            'start_year',
            'end_year'
        ]
        read_only_fields = ['id']
# endregion

# region: SocialLink Serializer
class SocialLinkSerializer(serializers.ModelSerializer):

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
            'platform',
            'url'
        ]
        read_only_fields = ['id']
# endregion

# region: Document Serializer
class DocumentSerializer(serializers.ModelSerializer):

    def validate_doc_type(self, value):
        if value not in dict(models.Document.DocumentType.choices):
            raise serializers.ValidationError(
                "Invalid document type."
            )
        return value

    def validate(self, data):
        portfolio = self.context.get('portfolio')
        if portfolio and data.get('doc_type') == models.Document.DocumentType.RESUME:
            if models.Document.objects.filter(portfolio=portfolio, doc_type=models.Document.DocumentType.RESUME).exists():
                raise serializers.ValidationError(
                    "Only one resume allowed per portfolio."
                )
        return data

    class Meta:
        model = models.Document
        fields = [
            'id',
            'file',
            'doc_type',
            'is_public',
            'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at']
# endregion

class PortfolioSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    
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
            'is_public',
            'is_published',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']