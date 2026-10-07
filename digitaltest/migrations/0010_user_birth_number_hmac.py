import hmac as _hmac
import hashlib
import os
from django.db import migrations, models


def populate_hmac(apps, schema_editor):
    User = apps.get_model('digitaltest', 'User')
    key = (os.getenv('SECRET_BIRTH_NUMBER_KEY') or '').encode()
    for user in User.objects.filter(birth_number__isnull=False).exclude(birth_number=''):
        digest = _hmac.new(key, user.birth_number.encode(), hashlib.sha256).hexdigest()
        user.birth_number_hmac = digest
        user.save(update_fields=['birth_number_hmac'])


class Migration(migrations.Migration):

    dependencies = [
        ('digitaltest', '0009_consentrecord'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='birth_number_hmac',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.RunPython(populate_hmac, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='birth_number_hmac',
            field=models.CharField(blank=True, max_length=64, null=True, unique=True),
        ),
    ]
