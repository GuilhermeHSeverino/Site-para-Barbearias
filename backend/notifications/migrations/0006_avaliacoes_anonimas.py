import re

from django.db import migrations

# avisos antigos traziam o nome do cliente ("Nova avaliação de Fulano: nota 9/10.")
PADRAO = re.compile(r"^Nova avaliação de .+: nota (\d+)/10\.$")


def anonimizar(apps, schema_editor):
    Notification = apps.get_model("notifications", "Notification")
    for aviso in Notification.objects.filter(type="REVIEW", message__startswith="Nova avaliação de "):
        encontrado = PADRAO.match(aviso.message)
        if encontrado:
            aviso.message = f"Nova avaliação recebida: nota {encontrado.group(1)}/10."
            aviso.save(update_fields=["message"])


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0005_lembretes"),
    ]

    operations = [
        migrations.RunPython(anonimizar, migrations.RunPython.noop),
    ]
