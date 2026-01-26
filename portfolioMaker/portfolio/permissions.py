from rest_framework.permissions import BasePermission

# region: Custom Permissions
class IsOwner(BasePermission):
    """
    Allows access only to owners of the object.
    """

    def has_object_permission(self, request, view, obj):
        return obj.portfolio.user == request.user
# endregion