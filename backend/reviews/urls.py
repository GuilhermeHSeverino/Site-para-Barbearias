from django.urls import path
from .views import ReviewCreateListView, ReviewRetrieveUpdateDestroyView

urlpatterns = [
    path('reviews/', ReviewCreateListView.as_view(), name='review-list-create'),
    path('reviews/<int:pk>/', ReviewRetrieveUpdateDestroyView.as_view(), name='review-retrieve-update-destroy'),
]
