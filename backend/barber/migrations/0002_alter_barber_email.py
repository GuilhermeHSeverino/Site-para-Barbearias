# Generated by Django 5.1.4 on 2024-12-12 16:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('barber', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='barber',
            name='email',
            field=models.EmailField(max_length=254, unique=True),
        ),
    ]
