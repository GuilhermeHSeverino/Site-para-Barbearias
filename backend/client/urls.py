from django.urls import path
from .views import ClientCreateListView, ClientRetrieveUpdateDestroyView, BarberClientNoteView, BarberClientNoteCreateView, ClientHistoryView, BarberClientNoteListView

urlpatterns = [
    path('client/', ClientCreateListView.as_view(), name='client-list-create'),
    path('client/<int:pk>/', ClientRetrieveUpdateDestroyView.as_view(), name='client-retrieve-update-destroy'),
    path('barber-notes/', BarberClientNoteListView.as_view(), name='barber-note-list'),
    path('barber-notes/create/', BarberClientNoteCreateView.as_view(), name='barber-note-create'),
    path('barber-notes/<int:pk>/', BarberClientNoteView.as_view(), name='barber-note-detail'),
    path('client-history/<int:client_id>/', ClientHistoryView.as_view(), name='client-history'),
]
