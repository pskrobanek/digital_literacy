from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('digitaltest', '0011_remove_user_birth_number'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='medicalstaff',
            name='birth_number',
        ),
    ]
