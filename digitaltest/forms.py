from django import forms
from django.core.exceptions import ValidationError
from digitaltest.models import User
from digitaltest.utils import hmac_birth_number


class SignupForm(forms.Form):
    """
    Patient self-registration form.

    Validates that the birth number is exactly 10 digits, matches the confirmation
    field, and has not already been registered. Enforces single-use signup: a patient
    who has already registered must go through staff to trigger a retake rather than
    re-registering. The save() method creates a new User (does not use get_or_create).
    """

    dob = forms.DateField(
        input_formats=['%d.%m.%Y', '%d/%m/%Y'],
        required=True,
        widget=forms.DateInput(
            format='%d.%m.%Y',
            attrs={
                'class': 'form-control',
                'placeholder': 'DD.MM.YYYY',
                'type': 'text',
            }
        )
    )

    first = forms.CharField(
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'First name'}),
        label='First Name',
    )
    last = forms.CharField(
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Last name'}),
        label='Last Name',
    )
    birth_number = forms.CharField(
        max_length=10,
        min_length=10,
        required=True,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Birth number'}),
        label='Birth Number',
        help_text='Your birth number will be used to access your account (10 digits only)',
    )
    birth_number_confirm = forms.CharField(
        max_length=10,
        min_length=10,
        required=True,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Confirm your birth number'}),
        label='Confirm Birth Number',
    )
    diagnosis = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Diagnosis (optional)', 'rows': 3}),
        label='Diagnosis (Optional)',
    )
    consent = forms.BooleanField(
        required=True,
        label='Privacy Policy consent',
        error_messages={'required': 'You must accept the Privacy Policy to continue.'},
    )
    
    def clean_birth_number(self):
        birth_number = self.cleaned_data.get('birth_number')
        if not birth_number.isdigit():
            raise ValidationError("Birth number must contain only digits.")
        if len(birth_number) != 10:
            raise ValidationError("Birth number must be exactly 10 digits.")
        return birth_number
    
    def clean(self):
        cleaned_data = super().clean()
        birth_number = cleaned_data.get('birth_number')
        birth_number_confirm = cleaned_data.get('birth_number_confirm')
        
        if birth_number and birth_number_confirm:
            if birth_number != birth_number_confirm:
                raise ValidationError("Birth numbers do not match.")

        # Enforce single-use signup: deny if birth number already exists
        if birth_number and User.objects.filter(birth_number_hmac=hmac_birth_number(birth_number)).exists():
            raise ValidationError("This birth number has already been registered. Contact staff for retake access.")
        
        return cleaned_data
    
    def save(self, commit=True):
        birth_number = self.cleaned_data['birth_number']
        defaults = {
            'first': self.cleaned_data['first'],
            'last': self.cleaned_data['last'],
            'dob': self.cleaned_data['dob'],
            'diagnosis': self.cleaned_data.get('diagnosis'),
            'birth_number_hmac': hmac_birth_number(birth_number),
        }
        user = User.objects.create(**defaults)
        return user


class MedicalStaffLoginForm(forms.Form):
    """
    Staff login form requiring doctor identity (first, last, email) and the patient's
    birth number. The email is used as the unique key for upserting the MedicalStaff
    record in MedicalStaffLoginView.post(). The patient birth number is validated as
    10 digits but NOT checked against the database here — that lookup happens in the view
    so a single "invalid credentials" message can cover both failure modes.
    """

    staff_first = forms.CharField(
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter staff first name',
            'data-i18n-placeholder': 'staffFirstNamePlaceholder'
        }),
        label='Staff First Name'
    )
    staff_last = forms.CharField(
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter staff last name',
            'data-i18n-placeholder': 'staffLastNamePlaceholder'
        }),
        label='Staff Last Name'
    )
    staff_email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'doctor@example.com',
            'data-i18n-placeholder': 'doctorEmailPlaceholder'
        }),
        label='Doctor Email'
    )
    patient_birth_number = forms.CharField(
        max_length=10,
        min_length=10,
        required=True,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter patient birth number',
            'data-i18n-placeholder': 'patientBirthNumberPlaceholder'
        }),
        label='Patient Birth Number'
    )

    def clean_patient_birth_number(self):
        birth_number = self.cleaned_data.get('patient_birth_number')
        if not birth_number.isdigit():
            raise ValidationError('Birth number must contain only digits.')
        if len(birth_number) != 10:
            raise ValidationError('Birth number must be exactly 10 digits.')
        return birth_number
    
