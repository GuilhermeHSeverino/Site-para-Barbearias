# Generated by Django 5.1.4 on 2024-12-12 17:37

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('barber', '0002_alter_barber_email'),
        ('client', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Schedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('barber', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='schedule', to='barber.barber')),
                ('client_name', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='schedule', to='client.client')),
            ],
        ),
    ]
