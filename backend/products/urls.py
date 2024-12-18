from django.urls import path

from .views import ProductCreateListView, ProductRetrieveUpdateDestroyView

urlpatterns = [
    path('products/', ProductCreateListView.as_view(), name='products-list-create'),
    path('products/<int:pk>/', ProductRetrieveUpdateDestroyView.as_view(), name='products-retrieve-update-destroy'),
]
