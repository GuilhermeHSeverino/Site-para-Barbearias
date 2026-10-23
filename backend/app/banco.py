from django.db import connection
from django.db.models import F


def travar(queryset):
    """Trava os registros até o fim da transação, para duas requisições não alterarem o mesmo dado ao mesmo tempo.

    No PostgreSQL (produção) é o SELECT ... FOR UPDATE: a segunda requisição espera a primeira terminar.
    O SQLite (desenvolvimento e testes) ignora o FOR UPDATE e trava o banco inteiro; se duas transações
    lerem e depois tentarem gravar, ele recusa uma delas ("database is locked"). Uma escrita neutra logo
    no início faz a transação já começar reservando a gravação, e as outras esperam a vez.
    """
    if connection.vendor == "sqlite":
        chave = queryset.model._meta.pk.attname
        queryset.update(**{chave: F(chave)})
    return queryset.select_for_update()
