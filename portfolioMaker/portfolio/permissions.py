from rest_framework.permissions import BasePermission

# region: Custom Permissions
class IsPortfolioOwner(BasePermission):
    """
    Allows access only to owners of the portfolio.
    """
    def has_object_permission(self, request, view, obj):
        # obj is a Portfolio
        return hasattr(obj, 'user') and obj.user == request.user
# endregion
# endregion