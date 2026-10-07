from django.db import models
from datetime import datetime, timezone

# (Stored Value, Readable Value)
TESTS = [
    ('Test1', 'Test 1'),
]

SURVEYS = [
    ('Survey1', 'Technology Usage Survey'),
]


class User(models.Model):
    """
    A patient registered in the system.

    Authentication is session-based only — there is no Django auth user.
    birth_number_hmac is HMAC-SHA256(birth_number, SECRET_BIRTH_NUMBER_KEY).
    The original birth number is never stored; the HMAC is used for all lookups.
    """

    first = models.CharField(max_length=30)
    last = models.CharField(max_length=30)
    dob = models.DateField(null=True, blank=True)
    birth_number_hmac = models.CharField(max_length=64, unique=True)
    diagnosis = models.TextField(blank=True, null=True)

    date_registered = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first} {self.last}"


class MedicalStaff(models.Model):
    """
    A clinician or support worker who can view patient results and trigger retakes.

    Records are upserted by email on each staff login, so name fields stay current
    without requiring a separate account-management flow. date_last_seen updates
    automatically via auto_now on every save.
    """

    first = models.CharField(max_length=30)
    last = models.CharField(max_length=30)
    email = models.EmailField(max_length=254, unique=True, null=True, blank=True)
    date_first_seen = models.DateTimeField(auto_now_add=True)
    date_last_seen = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.email:
            return f"{self.first} {self.last} <{self.email}>"
        return f"{self.first} {self.last}"


class TestResults(models.Model):
    """
    Stores the most recent completed test attempt for a (user, test_name) pair.

    Only one row exists per patient per test — retakes overwrite via update_or_create.
    date_first_taken is immutable (auto_now_add); date_last_taken only updates when
    the result score actually changes, so unchanged retakes don't shift the timestamp.

    Fields:
        result               -- final composite score (0–100) stored as a string
        speed                -- seconds from test start to last task completion
        avg_misclick_distance -- mean pixel distance of incorrect clicks from the target
        typing_duration      -- seconds taken on the typing task
        typing_accuracy      -- 0–100 % character-level accuracy on first attempt
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    test_name = models.CharField(max_length=30, choices=TESTS)
    result = models.CharField(max_length=3)
    speed = models.FloatField(null=True, blank=True)  # seconds
    avg_misclick_distance = models.FloatField(null=True, blank=True)  # pixels
    typing_duration = models.FloatField(null=True, blank=True)  # seconds
    typing_accuracy = models.FloatField(null=True, blank=True)  # 0–100 %
    date_first_taken = models.DateTimeField(auto_now_add=True)
    date_last_taken = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'test_name'], name='unique_user_test')
        ]

    def save(self, *args, **kwargs):
        now = datetime.now(timezone.utc)
        if self.pk is None:
            if self.date_last_taken is None:
                self.date_last_taken = now
        else:
            try:
                previous = TestResults.objects.get(pk=self.pk)
            except TestResults.DoesNotExist:
                previous = None
            if previous is not None and previous.result != self.result:
                self.date_last_taken = now
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.first} {self.user.last} - {self.test_name} - {self.date_first_taken.strftime('%Y-%m-%d %H:%M:%S')}"

    def is_recent(self):
        """Returns True if the result was last updated within the past 30 days."""
        now = datetime.now(timezone.utc)
        return (now - self.date_last_taken).days < 30


class SurveyResults(models.Model):
    """
    Stores the most recent survey submission for a (user, survey_name) pair.

    Same one-row-per-patient pattern as TestResults — retakes overwrite via
    update_or_create. responses is a JSON-encoded dict keyed by question id
    (e.g. {"q1": ["mobile_phone"], "q2": "press_buttons", ...}).

    date_last_taken only updates when the serialized responses string changes.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    survey_name = models.CharField(max_length=30, choices=SURVEYS)
    responses = models.TextField()  # JSON string of {question_id: answer} pairs
    date_first_taken = models.DateTimeField(auto_now_add=True)
    date_last_taken = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'survey_name'], name='unique_user_survey')
        ]

    def save(self, *args, **kwargs):
        now = datetime.now(timezone.utc)
        if self.pk is None:
            if self.date_last_taken is None:
                self.date_last_taken = now
        else:
            try:
                previous = SurveyResults.objects.get(pk=self.pk)
            except SurveyResults.DoesNotExist:
                previous = None
            if previous is not None and previous.responses != self.responses:
                self.date_last_taken = now
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.first} {self.user.last} - {self.survey_name} - {self.date_first_taken.strftime('%Y-%m-%d %H:%M:%S')}"


class RetakeEvent(models.Model):
    """
    Audit log entry created each time a staff member authorizes a patient retake.

    staff may be null if the retake was triggered without an active staff session.
    Does not delete or modify existing TestResults — it only resets the session flags
    so the patient can submit a new attempt (which then overwrites via update_or_create).
    """

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='retake_events')
    staff = models.ForeignKey(MedicalStaff, on_delete=models.SET_NULL, null=True, blank=True, related_name='retake_events')
    triggered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-triggered_at']

    def __str__(self):
        if self.staff:
            staff_ident = self.staff.email if self.staff.email else f"{self.staff.first} {self.staff.last}"
            return f"Retake for {self.patient} by {staff_ident} at {self.triggered_at.isoformat()}"
        return f"Retake for {self.patient} at {self.triggered_at.isoformat()}"


class ConsentRecord(models.Model):
    """GDPR Art. 7 — immutable record of when a patient gave explicit consent."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='consent')
    given_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    privacy_policy_version = models.CharField(max_length=20, default='1.0')
    withdrawn_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Consent for {self.user} at {self.given_at.isoformat()}"


class StaffAccessLog(models.Model):
    """GDPR Art. 5(2) — records every staff view of patient data."""

    staff = models.ForeignKey(MedicalStaff, on_delete=models.SET_NULL, null=True, related_name='access_logs')
    patient = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='access_logs')
    accessed_at = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=50, default='view_dashboard')

    class Meta:
        ordering = ['-accessed_at']

    def __str__(self):
        return f"{self.staff} accessed {self.patient} at {self.accessed_at.isoformat()}"
