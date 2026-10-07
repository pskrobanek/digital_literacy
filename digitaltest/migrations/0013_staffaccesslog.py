from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('digitaltest', '0012_remove_medicalstaff_birth_number'),
    ]

    operations = [
        migrations.CreateModel(
            name='StaffAccessLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('accessed_at', models.DateTimeField(auto_now_add=True)),
                ('action', models.CharField(default='view_dashboard', max_length=50)),
                ('patient', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='access_logs', to='digitaltest.user')),
                ('staff', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='access_logs', to='digitaltest.medicalstaff')),
            ],
            options={
                'ordering': ['-accessed_at'],
            },
        ),
    ]
