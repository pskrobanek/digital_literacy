from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Drops the plain-text birth_number column from User.
    Before running in production: verify
      User.objects.filter(birth_number_hmac__isnull=True).count() == 0
    """

    dependencies = [
        ('digitaltest', '0010_user_birth_number_hmac'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='birth_number',
        ),
        migrations.AlterField(
            model_name='user',
            name='birth_number_hmac',
            field=models.CharField(max_length=64, unique=True),
        ),
    ]
