from rest_framework import generics
from .models import Review
from .serializers import ReviewSerializer
from rest_framework.permissions import IsAuthenticated


class ReviewCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated,]
    queryset = Review.objects.select_related("client")
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        review = serializer.save()
        from notifications.services import notify_barber
        # a avaliação é anônima: o aviso ao barbeiro não identifica o cliente
        notify_barber(review.barber, f"Nova avaliação recebida: nota {review.rating}/10.", "REVIEW")

class ReviewRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated,]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        # somente o autor pode consultar, editar ou excluir a própria avaliação
        return Review.objects.filter(client__user=self.request.user)
