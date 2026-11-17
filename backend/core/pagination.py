from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
    """?page=<n>&page_size=<n> — the query params the frontend BaseFilter sends."""

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200
