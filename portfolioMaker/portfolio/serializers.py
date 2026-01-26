
# User Registration and Login Serializers

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.conf import settings
import jwt
from datetime import datetime, timedelta
from rest_framework import serializers
from . import models
from urllib.parse import urlparse

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

class ProjectSerializer(serializers.ModelSerializer):

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
            'title',
            'description',
            'tech_stack',
            'project_url',
            'is_published',
            'created_at'
        ]
        read_only_fields = ['id', 'is_published', 'created_at']


class ProjectDetailSerializer(serializers.ModelSerializer):
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
            'title',
            'description',
            'tech_stack',
            'project_url',
            'is_published',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class SkillSerializer(serializers.ModelSerializer):

    def validate_years_of_experience(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Years of experience cannot be negative."
            )
        return value

    class Meta:
        model = models.Skill
        fields = [
            'id',
            'name',
            'proficiency_level',
            'years_of_experience'
        ]
        read_only_fields = ['id']
