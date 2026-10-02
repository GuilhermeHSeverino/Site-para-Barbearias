from django.urls import path
from .views import StoreListCreateView,StoreRetrieveUpdateDestroyView, StoreSaleView, StorePendingView, StoreClientOrdersView, StoreCancelView, StoreConfirmView

urlpatterns = [
    path('stores/', StoreListCreateView.as_view(), name='store_list_create'),
    path('stores/sale/', StoreSaleView.as_view(), name='store_sale'),
    path('stores/pending/', StorePendingView.as_view(), name='store_pending'),
    path('stores/my-orders/', StoreClientOrdersView.as_view(), name='store_client_orders'),
    path('stores/<int:pk>/cancel/', StoreCancelView.as_view(), name='store_cancel'),
    path('stores/<int:pk>/confirm/', StoreConfirmView.as_view(), name='store_confirm'),
    path('stores/<int:pk>/', StoreRetrieveUpdateDestroyView.as_view(), name='store_retrieve_update_destroy'),
]
