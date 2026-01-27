from rest_framework.permissions import BasePermission

# region: Custom Permissions
# region: Custom Permissions
class IsPortfolioOwner(BasePermission):
    """
    Allows access only to owners of the portfolio.
    """
    def has_object_permission(self, request, view, obj):
        # obj is a Portfolio
        return hasattr(obj, 'user') and obj.user == request.user

class IsProjectOwner(BasePermission):
    """
    Allows access only to owners of the project (via portfolio).
    """
    def has_object_permission(self, request, view, obj):
        # obj is a Project
        return hasattr(obj, 'portfolio') and hasattr(obj.portfolio, 'user') and obj.portfolio.user == request.user
# endregion
# endregion