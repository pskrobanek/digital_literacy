from django.contrib import admin
from digitaltest.models import User, MedicalStaff, TestResults, SurveyResults, RetakeEvent, ConsentRecord, StaffAccessLog


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('first', 'last', 'date_registered')
    readonly_fields = ('birth_number_hmac', 'date_registered')
    search_fields = ('first', 'last')
    ordering = ('-date_registered',)


@admin.register(MedicalStaff)
class MedicalStaffAdmin(admin.ModelAdmin):
    list_display = ('first', 'last', 'email', 'date_last_seen')
    readonly_fields = ('date_first_seen', 'date_last_seen')
    search_fields = ('first', 'last', 'email')


@admin.register(TestResults)
class TestResultsAdmin(admin.ModelAdmin):
    list_display = ('user', 'test_name', 'result', 'date_last_taken')
    readonly_fields = ('user', 'date_first_taken', 'date_last_taken')


@admin.register(SurveyResults)
class SurveyResultsAdmin(admin.ModelAdmin):
    list_display = ('user', 'survey_name', 'date_last_taken')
    readonly_fields = ('user', 'date_first_taken', 'date_last_taken')


@admin.register(RetakeEvent)
class RetakeEventAdmin(admin.ModelAdmin):
    list_display = ('patient', 'staff', 'triggered_at')
    readonly_fields = ('patient', 'staff', 'triggered_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ConsentRecord)
class ConsentRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'given_at', 'privacy_policy_version', 'withdrawn_at')
    readonly_fields = ('user', 'given_at', 'ip_address', 'privacy_policy_version', 'withdrawn_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(StaffAccessLog)
class StaffAccessLogAdmin(admin.ModelAdmin):
    list_display = ('staff', 'patient', 'accessed_at', 'action')
    readonly_fields = ('staff', 'patient', 'accessed_at', 'action')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
