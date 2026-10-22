from rest_framework import generics
from .models import Review
from .serializers import ReviewSerializer
from rest_framework.permissions import IsAuthenticated


class ReviewCreateListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated,]
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        review = serializer.save()
        from notifications.services import notify_barber
        notify_barber(review.barber, f"Nova avaliação de {review.client.name}: nota {review.rating}/10.", "REVIEW")

class ReviewRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated,]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        # somente o autor pode consultar, editar ou excluir a própria avaliação
        return Review.objects.filter(client__user=self.request.user)
