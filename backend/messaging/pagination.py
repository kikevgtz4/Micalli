# backend/messaging/pagination.py
from rest_framework.pagination import CursorPagination
from rest_framework.response import Response


class MessageCursorPagination(CursorPagination):
    """
    Cursor-based pagination for messages.
    Provides stable pagination even with real-time updates.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100
    ordering = '-created_at'  # Newest first
    cursor_query_param = 'cursor'
    template = None
    
    def get_paginated_response(self, data):
        return Response({
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'has_next': self.has_next,
            'has_previous': self.has_previous,
        })


