from django.shortcuts import redirect
from django.conf import settings


class SitePasswordGate:
    """
    Middleware that enforces a site-wide password gate.
    Allows unauthenticated access only to landing and gate pages.
    All other pages redirect to the gate if not authenticated.
    """
    
    # Paths that do not require password authentication
    ALLOWED_PATHS = {
        '/',
        '/admin/',
        '/privacy/',
    }
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if user is already authenticated to the gate
        is_gate_authenticated = request.session.get('site_password_authenticated', False)
        
        # Check if current path is allowed
        current_path = request.path
        is_allowed_path = self._is_allowed_path(current_path)
        
        # Redirect to gate if accessing protected page without authentication
        if not is_gate_authenticated and not is_allowed_path:
            return redirect(f'/?next={current_path}')
        
        response = self.get_response(request)
        return response
    
    def _is_allowed_path(self, path):
        """Check if the path is in the allowed list."""
        # Exact matches
        if path in self.ALLOWED_PATHS:
            return True
        
        # Admin prefix
        if path.startswith('/admin/'):
            return True
        
        return False
