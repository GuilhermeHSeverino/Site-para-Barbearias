from django.db.models import ProtectedError
from rest_framework.response import Response
from rest_framework.views import exception_handler


def tratar_excecao(exc, context):
    """Responde com uma mensagem clara quando um registro com histórico não pode ser excluído."""
    if isinstance(exc, ProtectedError):
        return Response(
            {"detail": "Não é possível excluir: este registro já faz parte do histórico de agendamentos, "
                       "avaliações ou lançamentos."},
            status=400,
        )
    return exception_handler(exc, context)
