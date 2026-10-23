from django import forms
from django.contrib import admin
from django.contrib.auth.models import User

from .models import Barber


class NovoBarbeiroForm(forms.ModelForm):
    """Cadastro do barbeiro em uma única tela: o login é criado junto, com o e-mail como usuário."""
    senha = forms.CharField(label="Senha", widget=forms.PasswordInput, min_length=6,
                            help_text="O barbeiro entra no sistema com o e-mail e esta senha.")

    class Meta:
        model = Barber
        fields = ["name", "email", "phone", "senha", "work_start", "work_end", "break_start", "break_end"]
        labels = {
            "name": "Nome", "email": "E-mail", "phone": "Telefone",
            "work_start": "Início do expediente", "work_end": "Fim do expediente",
            "break_start": "Início do intervalo", "break_end": "Fim do intervalo",
        }

    def clean_email(self):
        email = self.cleaned_data["email"]
        if User.objects.filter(username__iexact=email).exists() or User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("Este e-mail já está cadastrado.")
        return email

    def clean(self):
        dados = super().clean()
        inicio, fim = dados.get("work_start"), dados.get("work_end")
        if inicio and fim and inicio >= fim:
            self.add_error("work_end", "O fim do expediente deve ser depois do início.")
        pausa_inicio, pausa_fim = dados.get("break_start"), dados.get("break_end")
        if pausa_inicio and pausa_fim and (pausa_inicio >= pausa_fim or (inicio and fim and (pausa_inicio < inicio or pausa_fim > fim))):
            self.add_error("break_end", "O intervalo precisa estar dentro do expediente.")
        return dados


@admin.register(Barber)
class BarberAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "work_start", "work_end")
    search_fields = ("name", "email")

    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            kwargs["form"] = NovoBarbeiroForm
        return super().get_form(request, obj, **kwargs)

    def get_fields(self, request, obj=None):
        if obj is None:
            return NovoBarbeiroForm.Meta.fields
        # na edição, o login já existe e não aparece no formulário
        return ["name", "email", "phone", "bio", "specialties", "work_start", "work_end", "break_start", "break_end"]

    def save_model(self, request, obj, form, change):
        if not change:
            # usuário comum: o perfil de barbeiro dá acesso às telas da barbearia, não ao painel de administração
            obj.user = User.objects.create_user(username=obj.email, email=obj.email, password=form.cleaned_data["senha"])
        super().save_model(request, obj, form, change)
