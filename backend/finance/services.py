from django.utils import timezone

from .models import Finances


def registrar_compra_de_produto(produto, quantidade, custo_total, barbeiro=None):
    """Lança a compra de mercadoria como saída no financeiro (categoria Produtos/Insumos)."""
    return Finances.objects.create(
        tipo=Finances.SAIDA,
        valor=custo_total,
        date=timezone.localdate(),
        categoria="produtos",
        barber=barbeiro,
        descricao=f"Compra de {quantidade} un. de {produto.name}",
    )
