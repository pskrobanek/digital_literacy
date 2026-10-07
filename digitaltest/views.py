import json
from decimal import Decimal, InvalidOperation

from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.views import View
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.urls import reverse
from django.conf import settings
from django.db import transaction

from digitaltest.forms import SignupForm, MedicalStaffLoginForm
from digitaltest.models import TestResults, SurveyResults, User, MedicalStaff, RetakeEvent, ConsentRecord, StaffAccessLog
from digitaltest.scoring import compute_literacy_score, recommend_apps, tier_for_score
from digitaltest.utils import hmac_birth_number, get_client_ip


MAX_TEST_DURATION_SECONDS = Decimal('120')
MISCLICK_DISTANCE_CAP_PIXELS = Decimal('500')
MAX_TYPING_DURATION_SECONDS = Decimal('30')


class SitePasswordGateView(TemplateView):
    """
    Entry point for the entire site. Requires a shared site password before granting
    access. On success, sets session['site_password_authenticated'] = True and
    redirects to the landing page. The SitePasswordGate middleware enforces this
    flag on every subsequent request.
    """

    template_name = 'gate.html'

    def get(self, request):
        if request.session.get('site_password_authenticated', False):
            return redirect(reverse('landing'))
        return render(request, self.template_name, {})

    def post(self, request):
        password = request.POST.get('password', '').strip()

        if password == settings.SITE_PASSWORD:
            request.session['site_password_authenticated'] = True
            return redirect(reverse('landing'))
        else:
            messages.error(request, 'Incorrect password. Please try again.')
            return render(request, self.template_name, {})


class PatientSessionMixin:
    """
    Mixin for patient-facing views. Resolves the active patient from the session.

    Session key: patient_user_id (set on signup or when staff selects a patient).
    Returns None (not a 404) when the session has no patient, so callers can
    redirect to signup rather than raising an error.
    """

    session_key = 'patient_user_id'

    def get_patient(self, request):
        patient_id = request.session.get(self.session_key)
        if not patient_id:
            return None
        return User.objects.filter(id=patient_id).first()


class StaffSessionMixin:
    """
    Mixin for staff-facing views. Resolves the patient currently selected by staff.

    Uses a separate session key (staff_patient_user_id) so staff can view a patient
    without overwriting the patient's own session state.
    """

    session_key = 'staff_patient_user_id'

    def get_selected_patient(self, request):
        patient_id = request.session.get(self.session_key)
        if not patient_id:
            return None
        return User.objects.filter(id=patient_id).first()


def calculate_final_test_score(
    correct_tasks,
    total_tasks,
    speed_seconds,
    avg_misclick_distance,
    typing_duration_seconds=None,
    typing_accuracy_percent=None,
):
    """
    Compute the 0–100 composite test score from raw task metrics.

    Scoring weights:
        65% — task accuracy (correct on first attempt / total tasks)
        15% — speed (faster than 120 s cap is better)
        10% — click precision (closer to target center is better, capped at 500 px)
         5% — typing speed (faster than 30 s cap is better)
         5% — typing accuracy (character-level match on first attempt)

    None inputs for optional metrics are treated as worst-case (0 contribution)
    rather than excluded, so partial submissions still produce a fair score.
    Returns an integer in [0, 100].
    """
    if not total_tasks:
        return 0

    correct_tasks = max(0, min(correct_tasks, total_tasks))
    accuracy_ratio = Decimal(correct_tasks) / Decimal(total_tasks)

    if speed_seconds is None:
        speed_ratio = Decimal('0')
    else:
        speed_ratio = Decimal('1') - min(speed_seconds, MAX_TEST_DURATION_SECONDS) / MAX_TEST_DURATION_SECONDS
        speed_ratio = max(Decimal('0'), speed_ratio)

    if avg_misclick_distance is None:
        precision_ratio = Decimal('1')
    else:
        precision_ratio = Decimal('1') - min(avg_misclick_distance, MISCLICK_DISTANCE_CAP_PIXELS) / MISCLICK_DISTANCE_CAP_PIXELS
        precision_ratio = max(Decimal('0'), precision_ratio)

    if typing_duration_seconds is None:
        typing_speed_ratio = Decimal('0')
    else:
        typing_duration_seconds = Decimal(str(typing_duration_seconds))
        typing_speed_ratio = Decimal('1') - min(typing_duration_seconds, MAX_TYPING_DURATION_SECONDS) / MAX_TYPING_DURATION_SECONDS
        typing_speed_ratio = max(Decimal('0'), typing_speed_ratio)

    if typing_accuracy_percent is None:
        typing_accuracy_ratio = Decimal('0')
    else:
        typing_accuracy_percent = Decimal(str(typing_accuracy_percent))
        typing_accuracy_percent = max(Decimal('0'), min(typing_accuracy_percent, Decimal('100')))
        typing_accuracy_ratio = typing_accuracy_percent / Decimal('100')

    weighted_score = (
        accuracy_ratio * Decimal('65')
        + speed_ratio * Decimal('15')
        + precision_ratio * Decimal('10')
        + typing_speed_ratio * Decimal('5')
        + typing_accuracy_ratio * Decimal('5')
    )

    return int(weighted_score.quantize(Decimal('1')))


@method_decorator(ensure_csrf_cookie, name='dispatch')
class TestView(PatientSessionMixin, TemplateView):
    """
    Renders the digital literacy test. Enforces the required patient flow:
    patient must exist in session and must have completed the survey first.
    The CSRF cookie decorator ensures test.js can POST results without a form.
    """

    template_name = 'test.html'

    def dispatch(self, request, *args, **kwargs):
        if not self.get_patient(request):
            return redirect('signup')
        if not request.session.get('survey_completed', False):
            return redirect('survey')
        return super().dispatch(request, *args, **kwargs)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class SurveyView(PatientSessionMixin, TemplateView):
    """
    Renders the technology usage survey. Must be completed before the test.
    Redirects to all_tasks_complete if the test is already done (handles back-button).
    The CSRF cookie decorator ensures survey.js can POST without a form.
    """

    template_name = 'survey.html'

    def dispatch(self, request, *args, **kwargs):
        if not self.get_patient(request):
            return redirect('signup')
        if request.session.get('test_completed', False):
            return redirect('all_tasks_complete')
        return super().dispatch(request, *args, **kwargs)


class SubmitResultsView(PatientSessionMixin, View):
    """
    JSON API endpoint called by test.js when the patient finishes the test.

    Accepts: score, total, speed, avg_misclick_distance, typing_duration, typing_accuracy
    Computes the final composite score, upserts TestResults, sets test_completed in
    the session, and returns next_url so the JS can redirect without a page reload.
    """

    def post(self, request):
        patient = self.get_patient(request)
        if not patient:
            return JsonResponse({'error': 'Missing patient session'}, status=403)

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        score = data.get('score')
        total = data.get('total')
        speed = data.get('speed')
        avg_misclick_distance = data.get('avg_misclick_distance')
        typing_duration = data.get('typing_duration')
        typing_accuracy = data.get('typing_accuracy')

        if score is None or total is None:
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        try:
            score = int(score)
            total = int(total)
            speed = Decimal(str(speed)) if speed is not None else None
            avg_misclick_distance = Decimal(str(avg_misclick_distance)) if avg_misclick_distance is not None else None
            typing_duration = float(typing_duration) if typing_duration is not None else None
            typing_accuracy = float(typing_accuracy) if typing_accuracy is not None else None
        except (ValueError, TypeError, InvalidOperation):
            return JsonResponse({'error': 'Invalid score payload'}, status=400)

        final_score = calculate_final_test_score(
            score,
            total,
            speed,
            avg_misclick_distance,
            typing_duration,
            typing_accuracy,
        )

        TestResults.objects.update_or_create(
            user=patient,
            test_name='Test1',
            defaults={
                'result': str(final_score),
                'speed': float(speed) if speed is not None else None,
                'avg_misclick_distance': float(avg_misclick_distance) if avg_misclick_distance is not None else None,
                'typing_duration': typing_duration,
                'typing_accuracy': typing_accuracy,
            },
        )

        request.session['test_correct_tasks'] = score
        request.session['test_total_tasks'] = total

        request.session['test_completed'] = True

        return JsonResponse({
            'status': 'ok',
            'next_url': reverse('all_tasks_complete'),
            'final_score': final_score,
            'correct_tasks': score,
            'total_tasks': total,
            'speed': float(speed) if speed is not None else None,
            'avg_misclick_distance': float(avg_misclick_distance) if avg_misclick_distance is not None else None,
            'typing_duration': typing_duration,
            'typing_accuracy': typing_accuracy,
        })


class SubmitSurveyView(PatientSessionMixin, View):
    """
    JSON API endpoint called by survey.js when the patient completes the survey.

    Accepts: responses (dict of {question_id: answer}), total
    Serializes responses to JSON and upserts SurveyResults. Sets survey_completed in
    the session and returns next_url (/test/) so the JS can redirect.
    """

    def post(self, request):
        patient = self.get_patient(request)
        if not patient:
            return JsonResponse({'error': 'Missing patient session'}, status=403)

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        responses = data.get('responses')

        if responses is None:
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        # Convert responses dict to JSON string for storage
        responses_json = json.dumps(responses)
        SurveyResults.objects.update_or_create(
            user=patient,
            survey_name='Survey1',
            defaults={'responses': responses_json},
        )

        request.session['survey_completed'] = True

        return JsonResponse({'status': 'ok', 'next_url': reverse('test')})


class SignupView(TemplateView):
    """
    Patient self-registration form. Creates a new User and initializes the session.

    Birth number uniqueness is enforced in SignupForm.clean() — attempting to
    re-register with an existing birth number shows an error directing the patient
    to contact staff for retake access instead.
    """

    template_name = 'signup.html'

    def get(self, request):
        form = SignupForm()
        return render(request, self.template_name, {'form': form})
    
    def post(self, request):
        form = SignupForm(request.POST)
        
        if form.is_valid():
            try:
                with transaction.atomic():
                    user = form.save()
                    ConsentRecord.objects.create(
                        user=user,
                        ip_address=get_client_ip(request),
                    )
                request.session['patient_user_id'] = user.id
                request.session['survey_completed'] = False
                request.session['test_completed'] = False
                return redirect('survey')
            except Exception as e:
                messages.error(request, f'An error occurred: {str(e)}')
                return render(request, self.template_name, {'form': form})
        else:
            messages.error(request, 'Please correct the errors below.')
            return render(request, self.template_name, {'form': form})


class LandingView(TemplateView):
    template_name = 'landing.html'


class MedicalStaffLoginView(TemplateView):
    """
    Staff login form. Authenticates by doctor email + patient birth number.

    The MedicalStaff record is upserted by email so the roster self-maintains
    without a separate admin step. The patient must already exist in the database
    (registered via SignupView). On success the view sets both a staff session and
    a patient session, then redirects to the dashboard.

    Session keys set: staff_user_id, staff_first, staff_last, staff_email,
    staff_patient_user_id, patient_user_id, survey_completed (True), test_completed (False).
    """

    template_name = 'staff_login.html'

    def get(self, request):
        form = MedicalStaffLoginForm(initial={
            'staff_first': request.session.get('staff_first', ''),
            'staff_last': request.session.get('staff_last', ''),
            'staff_email': request.session.get('staff_email', ''),
        })
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = MedicalStaffLoginForm(request.POST)

        if not form.is_valid():
            return render(request, self.template_name, {'form': form})

        staff_first = form.cleaned_data['staff_first'].strip()
        staff_last = form.cleaned_data['staff_last'].strip()
        staff_email = form.cleaned_data['staff_email'].strip()
        patient_birth_number = form.cleaned_data['patient_birth_number']

        try:
            patient = User.objects.get(birth_number_hmac=hmac_birth_number(patient_birth_number))
        except User.DoesNotExist:
            messages.error(request, 'Invalid credentials. Please check the doctor details and patient birth number.')
            return render(request, self.template_name, {'form': form})

        staff_member, _ = MedicalStaff.objects.update_or_create(
            email=staff_email,
            defaults={
                'first': staff_first,
                'last': staff_last,
            },
        )

        request.session['staff_user_id'] = staff_member.id
        request.session['staff_first'] = staff_member.first
        request.session['staff_last'] = staff_member.last
        request.session['staff_email'] = staff_member.email
        request.session['staff_patient_user_id'] = patient.id
        request.session['patient_user_id'] = patient.id
        request.session['survey_completed'] = True
        request.session['test_completed'] = False

        return redirect('staff_dashboard')


class MedicalStaffDashboardView(TemplateView):
    """
    Staff dashboard showing a selected patient's test and survey results.

    Computes the digital literacy score and app recommendations if both test and
    survey results exist. Also builds a chronological activity timeline of initial
    test and retake events. Requires an active staff session with a selected patient.
    """

    template_name = 'staff_dashboard.html'

    def dispatch(self, request, *args, **kwargs):
        if not request.session.get('staff_patient_user_id'):
            return redirect('staff_login')
        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        staff_patient_user_id = self.request.session.get('staff_patient_user_id')
        staff_user_id = self.request.session.get('staff_user_id')

        context['staff_first'] = self.request.session.get('staff_first')
        context['staff_last'] = self.request.session.get('staff_last')
        context['staff_email'] = self.request.session.get('staff_email')

        try:
            patient = User.objects.get(id=staff_patient_user_id)
        except User.DoesNotExist:
            self.request.session.pop('staff_patient_user_id', None)
            context['patient'] = None
            context['test_result'] = None
            context['survey_result'] = None
            return context

        staff_member = MedicalStaff.objects.filter(id=staff_user_id).first() if staff_user_id else None
        test_result = TestResults.objects.filter(user=patient, test_name='Test1').first()
        survey_result = SurveyResults.objects.filter(user=patient, survey_name='Survey1').first()
        retake_events = RetakeEvent.objects.filter(patient=patient).select_related('staff')[:10]

        activity_events = []
        if test_result:
            activity_events.append({
                'label': 'Initial test taken',
                'type': 'initial_test',
                'timestamp': test_result.date_first_taken,
                'staff': None,
            })

        for event in retake_events:
            activity_events.append({
                'label': 'Retake started',
                'type': 'retake_started',
                'timestamp': event.triggered_at,
                'staff': event.staff,
            })

        activity_events.sort(key=lambda item: item['timestamp'])

        literacy_score = None
        literacy_tier = None
        recommended_apps = []
        if test_result and survey_result:
            try:
                responses = json.loads(survey_result.responses or '{}')
            except json.JSONDecodeError:
                responses = {}
            literacy_score = compute_literacy_score(test_result.result, responses)
            if literacy_score is not None:
                literacy_tier = tier_for_score(literacy_score)
                recommended_apps = recommend_apps(literacy_score)

        if staff_member and patient:
            StaffAccessLog.objects.create(staff=staff_member, patient=patient)

        context['staff_member'] = staff_member
        context['patient'] = patient
        context['test_result'] = test_result
        context['survey_result'] = survey_result
        context['retake_events'] = retake_events
        context['activity_events'] = activity_events
        context['literacy_score'] = literacy_score
        context['literacy_tier'] = literacy_tier
        context['recommended_apps'] = recommended_apps

        return context


class MedicalStaffStartRetakeView(View):
    """
    Creates a RetakeEvent audit record and resets the patient's test session flags
    so they can submit a new test attempt. Does NOT delete or clear existing
    TestResults — the new submission will overwrite via update_or_create.
    Requires an active staff session.
    """

    def post(self, request):
        staff_patient_user_id = request.session.get('staff_patient_user_id')
        staff_user_id = request.session.get('staff_user_id')
        if not staff_patient_user_id:
            return redirect('staff_login')

        try:
            patient = User.objects.get(id=staff_patient_user_id)
        except User.DoesNotExist:
            request.session.pop('staff_patient_user_id', None)
            messages.error(request, 'Patient session is no longer valid. Please log in again.')
            return redirect('staff_login')

        staff_member = MedicalStaff.objects.filter(id=staff_user_id).first() if staff_user_id else None
        RetakeEvent.objects.create(patient=patient, staff=staff_member)

        # Start a fresh test attempt while preserving historical data in TestResults.
        request.session['patient_user_id'] = patient.id
        request.session['survey_completed'] = True
        request.session['test_completed'] = False
        request.session.pop('test_correct_tasks', None)
        request.session.pop('test_total_tasks', None)

        return redirect('test')


class MedicalStaffSwitchPatientView(View):
    """Clears the selected patient from the staff session and returns to staff login."""

    def post(self, request):
        request.session.pop('staff_patient_user_id', None)
        request.session.pop('patient_user_id', None)
        request.session.pop('survey_completed', None)
        request.session.pop('test_completed', None)
        return redirect('staff_login')


class MedicalStaffLogoutView(View):
    """Clears the full staff session (staff identity + selected patient) and returns to staff login."""

    def post(self, request):
        request.session.pop('staff_user_id', None)
        request.session.pop('staff_first', None)
        request.session.pop('staff_last', None)
        request.session.pop('staff_email', None)
        request.session.pop('staff_patient_user_id', None)
        request.session.pop('patient_user_id', None)
        return redirect('staff_login')


class SessionLogoutView(View):
    """Clears the patient session and redirects to signup (used by the patient 'start over' action)."""

    def post(self, request):
        request.session.pop('patient_user_id', None)
        request.session.pop('survey_completed', None)
        request.session.pop('test_completed', None)
        request.session.pop('test_correct_tasks', None)
        request.session.pop('test_total_tasks', None)
        return redirect('signup')


class PrivacyPolicyView(TemplateView):
    template_name = 'privacy_policy.html'


class PatientDataSettingsView(PatientSessionMixin, View):
    """Landing page for GDPR data rights — download or delete personal data."""

    def get(self, request):
        if request.session.get('staff_user_id'):
            return redirect('staff_dashboard')
        patient = self.get_patient(request)
        if not patient:
            return redirect('signup')
        return render(request, 'data_settings.html', {})


class PatientDeleteAccountView(PatientSessionMixin, View):
    """GDPR Art. 17 — patient-initiated deletion of all their personal data."""

    def get(self, request):
        if request.session.get('staff_user_id'):
            return redirect('staff_dashboard')
        patient = self.get_patient(request)
        if not patient:
            return redirect('signup')
        return render(request, 'delete_account_confirm.html', {})

    def post(self, request):
        if request.session.get('staff_user_id'):
            return redirect('staff_dashboard')
        patient = self.get_patient(request)
        if not patient:
            return redirect('signup')
        patient.delete()
        request.session.flush()
        messages.success(request, 'Your data has been permanently deleted.')
        return redirect('gate')


class PatientDataExportView(PatientSessionMixin, View):
    """GDPR Art. 20 — machine-readable export of all personal data for the session patient."""

    def get(self, request):
        if request.session.get('staff_user_id'):
            return redirect('staff_dashboard')
        patient = self.get_patient(request)
        if not patient:
            return redirect('signup')

        test_result = TestResults.objects.filter(user=patient, test_name='Test1').first()
        survey_result = SurveyResults.objects.filter(user=patient, survey_name='Survey1').first()
        consent = ConsentRecord.objects.filter(user=patient).first()
        retake_events = RetakeEvent.objects.filter(patient=patient).select_related('staff')
        access_logs = StaffAccessLog.objects.filter(patient=patient).select_related('staff')

        try:
            survey_responses = json.loads(survey_result.responses) if survey_result else None
        except (json.JSONDecodeError, TypeError):
            survey_responses = survey_result.responses if survey_result else None

        export = {
            'first': patient.first,
            'last': patient.last,
            'dob': str(patient.dob) if patient.dob else None,
            'diagnosis': patient.diagnosis,
            'date_registered': patient.date_registered.isoformat(),
            'consent': {
                'given_at': consent.given_at.isoformat() if consent else None,
                'privacy_policy_version': consent.privacy_policy_version if consent else None,
                'withdrawn_at': consent.withdrawn_at.isoformat() if consent and consent.withdrawn_at else None,
            },
            'test_result': {
                'result': test_result.result,
                'speed': test_result.speed,
                'avg_misclick_distance': test_result.avg_misclick_distance,
                'typing_duration': test_result.typing_duration,
                'typing_accuracy': test_result.typing_accuracy,
                'date_first_taken': test_result.date_first_taken.isoformat(),
                'date_last_taken': test_result.date_last_taken.isoformat() if test_result.date_last_taken else None,
            } if test_result else None,
            'survey_result': {
                'responses': survey_responses,
                'date_first_taken': survey_result.date_first_taken.isoformat() if survey_result else None,
                'date_last_taken': survey_result.date_last_taken.isoformat() if survey_result and survey_result.date_last_taken else None,
            } if survey_result else None,
            'retake_events': [
                {
                    'triggered_at': e.triggered_at.isoformat(),
                    'staff_email': e.staff.email if e.staff else None,
                }
                for e in retake_events
            ],
            'staff_access_logs': [
                {
                    'accessed_at': log.accessed_at.isoformat(),
                    'staff_email': log.staff.email if log.staff else None,
                    'action': log.action,
                }
                for log in access_logs
            ],
        }

        response = HttpResponse(
            json.dumps(export, indent=2),
            content_type='application/json',
        )
        response['Content-Disposition'] = 'attachment; filename="therahub-data-export.json"'
        response['Cache-Control'] = 'no-store'
        return response


class AllTasksCompleteView(PatientSessionMixin, TemplateView):
    """
    Confirmation page shown after both survey and test are done.

    Enforces the completion flow: redirects back to survey or test if either flag
    is not set, preventing patients from reaching this page by directly navigating.
    """

    template_name = 'all_tasks_complete.html'

    def dispatch(self, request, *args, **kwargs):
        if not self.get_patient(request):
            return redirect('signup')
        if not request.session.get('test_completed', False):
            if request.session.get('survey_completed', False):
                return redirect('test')
            return redirect('survey')
        return super().dispatch(request, *args, **kwargs)
