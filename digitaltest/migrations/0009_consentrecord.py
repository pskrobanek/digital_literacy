from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('digitaltest', '0008_remove_medicalstaff_internal_id_remove_user_email_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConsentRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('given_at', models.DateTimeField(auto_now_add=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('privacy_policy_version', models.CharField(default='1.0', max_length=20)),
                ('withdrawn_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='consent', to='digitaltest.user')),
            ],
        ),
    ]
