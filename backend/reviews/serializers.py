from rest_framework import serializers
from .models import Review
from client.models import Client
from schedule.models import Schedule

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"
        read_only_fields = ("client", "schedule")

    def validate(self, attrs):
        if self.instance is not None:
            # na edição, o barbeiro avaliado não pode ser trocado
            attrs.pop("barber", None)
            return attrs

        request = self.context["request"]
        client = Client.objects.filter(user=request.user).first()
        if not client:
            raise serializers.ValidationError({"detail": "Apenas clientes podem enviar avaliações."})

        # cada atendimento concluído pode ser avaliado uma única vez
        schedule = (
            Schedule.objects.filter(client_name=client, barber=attrs["barber"], status="concluido", review__isnull=True)
            .order_by("-date", "-start_time")
            .first()
        )
        if not schedule:
            if Schedule.objects.filter(client_name=client, barber=attrs["barber"], status="concluido").exists():
                raise serializers.ValidationError({"detail": "Todos os seus atendimentos com este barbeiro já foram avaliados."})
            raise serializers.ValidationError({"detail": "Você só pode avaliar um barbeiro após concluir um atendimento com ele."})

        attrs["client"] = client
        attrs["schedule"] = schedule
        return attrs
