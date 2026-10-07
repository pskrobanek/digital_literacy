"""
URL configuration for therahub project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from digitaltest.views import LandingView, SitePasswordGateView, SignupView, TestView, SubmitResultsView, SurveyView, SubmitSurveyView, AllTasksCompleteView, SessionLogoutView, MedicalStaffLoginView, MedicalStaffDashboardView, MedicalStaffStartRetakeView, MedicalStaffLogoutView, MedicalStaffSwitchPatientView, PrivacyPolicyView, PatientDeleteAccountView, PatientDataExportView, PatientDataSettingsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', SitePasswordGateView.as_view(), name='gate'),
    path('landing/', LandingView.as_view(), name='landing'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('test/', TestView.as_view(), name='test'),
    path('test/submit/', SubmitResultsView.as_view(), name='submit_results'),
    path('survey/', SurveyView.as_view(), name='survey'),
    path('survey/submit/', SubmitSurveyView.as_view(), name='submit_survey'),
    path('complete/', AllTasksCompleteView.as_view(), name='all_tasks_complete'),
    path('logout/', SessionLogoutView.as_view(), name='logout'),
    path('privacy/', PrivacyPolicyView.as_view(), name='privacy_policy'),
    path('account/', PatientDataSettingsView.as_view(), name='data_settings'),
    path('account/delete/', PatientDeleteAccountView.as_view(), name='delete_account'),
    path('account/export/', PatientDataExportView.as_view(), name='export_data'),
    path('staff/login/', MedicalStaffLoginView.as_view(), name='staff_login'),
    path('staff/dashboard/', MedicalStaffDashboardView.as_view(), name='staff_dashboard'),
    path('staff/switch-patient/', MedicalStaffSwitchPatientView.as_view(), name='staff_switch_patient'),
    path('staff/start-retake/', MedicalStaffStartRetakeView.as_view(), name='staff_start_retake'),
    path('staff/logout/', MedicalStaffLogoutView.as_view(), name='staff_logout'),
]
