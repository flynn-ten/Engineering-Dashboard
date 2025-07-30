import datetime
import time
import uuid
from django.utils import timezone  # Tambahan dari baru
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from django.db import connection
import pandas as pd
from .utils import log_audit_action

from .models import AuditTrail
from .serializers import AuditTrailSerializer


from .permissions import IsAdminUserProfile
from .models import (
    UserProfile, WorkRequest, WorkOrder,
    EnergyInput, Document,
    active_work_orders, analytics
)
from .serializers import (
    PlannedMaintenanceSerializer, UserProfileWithUserSerializer, UserProfileSerializer, UserSerializer,
    WorkRequestSerializer, WorkOrderSerializer,
    WorkOrderUpdateSerializer, WorkOrderStatusSerializer,
    EnergyInputSerializer, DocumentSerializer,
    CustomTokenObtainPairSerializer
)
from rest_framework.generics import RetrieveUpdateAPIView, ListCreateAPIView, UpdateAPIView, CreateAPIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import AuditTrail  # Pastikan model sudah ada
def log_audit_action(user, action, model_name, object_id=None, description=""):
    AuditTrail.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=object_id,
        description=description
    )
class SendDailyReportAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserProfile]

    def post(self, request):
        today = now().date()

        # Work Request hari ini
        wr_today = WorkRequest.objects.filter(created_at__date=today)
        wo_today = WorkOrder.objects.filter(wo_created_at__date=today)

        # Format isi email
        wr_lines = [
            f"- [{wr.wr_number}] {wr.title} | {wr.asset_department} | {wr.resource} | {wr.status}"
            for wr in wr_today
        ]
        wo_lines = [
            f"- [{wo.wo_number}] {wo.title} | {wo.asset_department} | {wo.resource} | {wo.status}"
            for wo in wo_today
        ]

        if not wr_lines and not wo_lines:
            return Response({"message": "Tidak ada WR atau WO hari ini."}, status=200)

        content = "📋 Laporan WR & WO Hari Ini:\n\n"

        if wr_lines:
            content += "🔧 Work Request Hari Ini:\n" + "\n".join(wr_lines) + "\n\n"
        if wo_lines:
            content += "🛠️ Work Order Hari Ini:\n" + "\n".join(wo_lines)

        recipient = getattr(settings, "REPORT_RECIPIENT_EMAIL", None)
        if not recipient:
            return Response({"error": "Email tujuan belum diatur di settings."}, status=500)

        try:
            send_mail(
                subject=f"[Daily Report] WR & WO - {today.strftime('%d %B %Y')}",
                message=content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            log_audit_action(
                user=request.user,
                action="email_sent",
                model_name="DailyReport",
                description=f"Laporan harian WR & WO tanggal {today} dikirim ke {recipient}"
            )
            return Response({"message": f"Laporan berhasil dikirim ke {recipient}."}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
            
            
class AuditTrailListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logs = AuditTrail.objects.all().order_by('-timestamp')[:50]
        serializer = AuditTrailSerializer(logs, many=True)
        return Response(serializer.data)

# Semua class-based views dari versi terbaru disatukan
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .serializers import CustomTokenObtainPairSerializer
from .models import AuditTrail
from django.contrib.auth.models import User
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({"detail": str(e)}, status=401)

        user = serializer.user  # ⬅️ user ini hanya ada kalau kamu set di serializer
        AuditTrail.objects.create(
            user=user,
            action="login",
            model_name="User",
            object_id=str(user.id),
            description=f"{user.username} logged in",
        )
        print(f"[AUDIT LOGGED] {user.username} login at {timezone.now()}")

        return Response(serializer.validated_data, status=status.HTTP_200_OK)

class ReleaseScheduledWorkOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = timezone.localdate()
        tz = timezone.get_current_timezone()
        start_of_day = timezone.make_aware(datetime.combine(today, time.min), tz)
        end_of_day = timezone.make_aware(datetime.combine(today, time.max), tz)

        scheduled_wos = WorkOrder.objects.filter(
            status="planned",
            wo_start_date__range=(start_of_day, end_of_day)
        )

        print(f"Releasing {scheduled_wos.count()} scheduled WOs...")

        released_list = []
        for wo in scheduled_wos:
            wo.status = "released"
            wo.wo_start_date = timezone.now()  # Optionally update timestamp
            wo.save()
            released_list.append(wo.wo_number)

        return Response({"released": released_list, "count": len(released_list)})

class PlannedMaintenanceCreateView(CreateAPIView):
    queryset = WorkOrder.objects.all()
    serializer_class = PlannedMaintenanceSerializer
    permission_classes = [IsAuthenticated]

class PlannedMaintenanceCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()

        # Set auto-generated fields
        data["wo_number"] = f"PM-{uuid.uuid4().hex[:8].upper()}"
        data["status"] = "unreleased"
        data["wo_created_at"] = timezone.now()

        serializer = PlannedMaintenanceSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class WorkOrderDetailAPIView(RetrieveUpdateAPIView):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderUpdateSerializer
    permission_classes = [IsAuthenticated]

class WorkOrderListCreateAPIView(ListCreateAPIView):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [IsAuthenticated]

class WorkOrderUpdateAPIView(UpdateAPIView):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "wo_number"

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)
        return Response(serializer.data)

class WorkOrderStatusUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, wo_number):
        try:
            wo = WorkOrder.objects.get(wo_number=wo_number)
        except WorkOrder.DoesNotExist:
            return Response({"error": "Work Order not found"}, status=404)

        # ✅ PASS CONTEXT HERE
        serializer = WorkOrderStatusSerializer(wo, data=request.data, partial=True, context={"request": request})
        
        if serializer.is_valid():
            print("🔥 Validated:", serializer.validated_data)
            updated_wo = serializer.save()
            log_audit_action(
                    user=request.user,
                    action="update",
                    model_name="WorkOrder",
                    object_id=updated_wo.wo_number,
                    description=f"Update status WO ke {updated_wo.status}"
            )
            # ✅ Email logic stays the same
            if updated_wo.status == "completed":
                requester_user = updated_wo.requester
                if requester_user and requester_user.email:
                    try:
                        duration_hours = round(updated_wo.actual_duration.total_seconds() / 3600, 2) if updated_wo.actual_duration else "N/A"
                        full_name = getattr(requester_user.userprofile, "full_name", requester_user.get_username())
                        subject = f"[WO Completed] {updated_wo.title or updated_wo.wo_number}"
                        message = f"""
Hai {full_name},

Work Order dengan ID {updated_wo.wo_number} telah diselesaikan ✅

Detail:
- Judul: {updated_wo.title}
- Deskripsi: {updated_wo.description or '-'}
- Resource: {updated_wo.resource}
- Durasi: {duration_hours} jam

Silakan cek sistem untuk informasi selengkapnya.
Terima kasih!

⚙️ Engineering Team
"""
                        send_mail(
                            subject,
                            message,
                            settings.DEFAULT_FROM_EMAIL,
                            [requester_user.email],
                            fail_silently=False,
                        )
                        print(f"✅ Email terkirim ke {requester_user.email}")
                        log_audit_action(
                            user=request.user,
                            action="email_sent",
                            model_name="WorkOrder",
                            object_id=updated_wo.wo_number,
                            description=f"Email WO selesai dikirim ke {requester_user.email}"
                        )
                    except Exception as e:
                        import traceback
                        traceback.print_exc()
                        print(f"❌ Gagal kirim email WO completed: {e}")
            
            return Response(WorkOrderSerializer(updated_wo).data)
            
        return Response(serializer.errors, status=400)



class WorkRequestStatusUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        wr = get_object_or_404(WorkRequest, pk=pk)
        new_status = request.data.get("status")

        if new_status not in ["approved", "rejected"]:
            return Response({"error": "Invalid status value"}, status=400)

        wr.status = new_status
        requester = wr.requested_by
        email = requester.email

        if new_status == "approved":
            wr.approved_at = timezone.now()

            # ✅ Kirim Email - Approved
            try:
                subject = f"[Work Request Approved] {wr.title} - {wr.wr_number}"
                message = (
                    f"Hai {requester.get_full_name() or requester.username},\n\n"
                    f"Permintaan kerjamu telah disetujui oleh admin dan akan segera diproses menjadi Work Order.\n\n"
                    f"Judul: {wr.title}\n"
                    f"Deskripsi: {wr.description}\n"
                    f"Departemen: {wr.asset_department}\n"
                    f"Asset: {wr.asset_number}\n"
                    f"Resource: {wr.resource or '-'}\n"
                    f"Tipe Permintaan: {wr.wr_type}\n"
                    f"Urgensi: {wr.urgency}\n"
                    f"Tanggal Kejadian: {wr.actual_failure_date}\n"
                    f"Target Selesai: {wr.completion_by_date}\n"
                    f"Status: {wr.status.upper()}\n"
                    f"Tanggal Approve: {wr.approved_at.strftime('%Y-%m-%d %H:%M')}\n\n"
                    f"Terima kasih."
                )
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            except Exception as e:
                print("❌ Gagal kirim email approved:", str(e))
            
            # 🛠 Auto-create WO
            if not WorkOrder.objects.filter(wr_number=wr.wr_number).exists():
                try:
                    WorkOrder.objects.create(
                        wr_number=wr.wr_number,
                        title=wr.title,
                        description=wr.description,
                        urgency=wr.urgency,
                        wo_type=wr.wr_type,
                        requester=wr.requested_by,
                        asset_number=wr.asset_number,
                        asset_department=wr.asset_department,
                        actual_failure_date=wr.actual_failure_date,
                        completion_by_date=wr.completion_by_date,
                        resource=wr.resource,
                        work_request=wr,
                    )
                except Exception as e:
                    return Response({"error": f"Failed to create WO: {str(e)}"}, status=500)
                log_audit_action(
                    user=request.user,
                    action="create",
                    model_name="WorkOrder",
                    object_id=wr.wr_number,
                    description=f"Auto-created WO dari WR: {wr.wr_number}"
                )
        elif new_status == "rejected":
            # ❌ Kirim Email - Rejected
            try:
                subject = f"[Work Request Rejected] {wr.title} - {wr.wr_number}"
                message = (
                    f"Hai {requester.get_full_name() or requester.username},\n\n"
                    f"Maaf, permintaan kerjamu telah DITOLAK oleh admin.\n\n"
                    f"Judul: {wr.title}\n"
                    f"Deskripsi: {wr.description}\n"
                    f"Departemen: {wr.asset_department}\n"
                    f"Asset: {wr.asset_number}\n"
                    f"Resource: {wr.resource or '-'}\n"
                    f"Tipe Permintaan: {wr.wr_type}\n"
                    f"Urgensi: {wr.urgency}\n"
                    f"Tanggal Kejadian: {wr.actual_failure_date}\n"
                    f"Target Selesai: {wr.completion_by_date}\n"
                    f"Status: {wr.status.upper()}\n\n"
                    f"Silakan periksa kembali atau hubungi tim admin untuk informasi lebih lanjut.\n\n"
                    f"Terima kasih."
                )
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            except Exception as e:
                print("❌ Gagal kirim email rejected:", str(e))

        wr.save()
        log_audit_action(
            user=request.user,
            action=new_status,
            model_name="WorkRequest",
            object_id=wr.wr_number,
            description=f"{new_status.capitalize()} WR: {wr.title}"
        )
        return Response({"message": f"Status updated to {new_status}"}, status=200)
    
    
class WorkRequestCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = WorkRequestSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            work_request = serializer.save()

            email = request.user.email

            # ✅ Kirim Email setelah berhasil disimpan
            try:
                subject = f"[Work Request] {work_request.title} - {work_request.wr_number}"
                message = (
                    f"Hai,\n\n"
                    f"Ada permintaan baru yang dikirim oleh {request.user.get_full_name()} ({request.user.email})\n\n"
                    f"Judul: {work_request.title}\n"
                    f"Deskripsi: {work_request.description}\n"
                    f"Departemen: {work_request.asset_department}\n"
                    f"Asset: {work_request.asset_number}\n"
                    f"Resource: {work_request.resource or '-'}\n"
                    f"Tipe Permintaan: {work_request.wr_type}\n"
                    f"Urgensi: {work_request.urgency}\n"
                    f"Tanggal Kejadian: {work_request.actual_failure_date}\n"
                    f"Target Selesai: {work_request.completion_by_date}\n"
                    f"Status: {work_request.status}\n\n"
                    f"Terima kasih.\n"
                )
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            except Exception as e:
                print("❌ Gagal kirim email:", str(e))
            # ✅ LOG AUDIT DI SINI
            log_audit_action(
                user=request.user,
                action="create",
                model_name="WorkRequest",
                object_id=work_request.wr_number,
                description=f"Submitted WR: {work_request.title} dari {request.user.username}"
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        print("❌ Serializer Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        user = request.user
        role = getattr(user.userprofile, 'role', None)

        if role == 'admin':
            queryset = WorkRequest.objects.all().order_by('-created_at')
        else:
            queryset = WorkRequest.objects.filter(requested_by=user).order_by('-created_at')

        serializer = WorkRequestSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print("DEBUG:", request.user, request.user.userprofile.role)
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class RegisterUserView(APIView):
    permission_classes = [IsAdminUserProfile]

    def post(self, request):
        user = request.user

        if not user.is_authenticated or not hasattr(user, 'userprofile') or user.userprofile.role != 'admin':
            return Response({"error": "Unauthorized"}, status=403)

        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email", "")
        full_name = request.data.get("full_name", "")
        role = request.data.get("role")
        division = request.data.get("division", "")

        if not username or not password or not role or not full_name:
            return Response({"error": "All fields required"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=400)

        user = User.objects.create_user(username=username, password=password, email=email)
        user.first_name = full_name
        user.save()

        if role == "requester":
            UserProfile.objects.create(user=user, full_name=full_name, role=role, division=division)
        else:
            UserProfile.objects.create(user=user, full_name=full_name, role=role)

        return Response({"message": "User created"}, status=201)

class DivisionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        divisions = ["Halal Representative", "HSSE", "IT", "PD", "DP", "DS","QA", "QC", "EN", "QSC", "RD", "WH"]
        return Response(divisions)

class UserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserProfile]

    def get(self, request):
        profiles = UserProfile.objects.select_related("user").all()
        serializer = UserProfileWithUserSerializer(profiles, many=True)
        return Response(serializer.data)

class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all()
        total_users = users.count()
        active_users = users.filter(userprofile__status="Active").count()

        return Response({
            "total_users": total_users,
            "active_users": active_users
        })
def active_work_orders(request):
    # Raw SQL to query active work orders
    with connection.cursor() as cursor:
        cursor.execute("""
        WITH weekly_complete AS (
            SELECT
                EXTRACT(YEAR FROM wo_created_at)::INT AS year,
                EXTRACT(MONTH FROM wo_created_at)::INT AS month,
                FLOOR((EXTRACT(DAY FROM wo_created_at) - 1) / 7) + 1 AS week_of_month,
                COUNT(*) AS released_count
            FROM engineering_app_workorder
            WHERE status = 'released'
            GROUP BY year, month, week_of_month
            )

            SELECT
            year,
            month,
            week_of_month,
            released_count,
            LAG(released_count) OVER (
                PARTITION BY year, month
                ORDER BY week_of_month
            ) AS last_week_count,
            released_count - COALESCE(
                LAG(released_count) OVER (
                PARTITION BY year, month
                ORDER BY week_of_month
                ), 0
            ) AS diff_from_last_week
            FROM weekly_complete
            ORDER BY year DESC, month DESC, week_of_month DESC;
        """)
        rows = cursor.fetchall()

    # Return results as JSON
    complete = [{"year": row[0], "month": row[1], "week_of_month": row[2], "released_count": row[3], "last_week_count": row[4], "diff_from_last_week": row[5]} for row in rows]
    return JsonResponse(complete, safe=False)

def unreleased_work_orders(request):
    # Raw SQL to query unreleased work orders
    with connection.cursor() as cursor:
        cursor.execute("""
            WITH weekly_complete AS (
            SELECT
                EXTRACT(YEAR FROM wo_created_at)::INT AS year,
                EXTRACT(MONTH FROM wo_created_at)::INT AS month,
                FLOOR((EXTRACT(DAY FROM wo_created_at) - 1) / 7) + 1 AS week_of_month,
                COUNT(*) AS unreleased_count
            FROM engineering_app_workorder
            WHERE status = 'unreleased'
            GROUP BY year, month, week_of_month
            )

            SELECT
            year,
            month,
            week_of_month,
            unreleased_count,
            LAG(unreleased_count) OVER (
                PARTITION BY year, month
                ORDER BY week_of_month
            ) AS last_week_count,
            unreleased_count - COALESCE(
                LAG(unreleased_count) OVER (
                PARTITION BY year, month
                ORDER BY week_of_month
                ), 0
            ) AS diff_from_last_week_unreleased
            FROM weekly_complete
            ORDER BY year DESC, month DESC, week_of_month DESC
        """)
        rows = cursor.fetchall()

    # Return results as JSON
    unreleased = [{"year": row[0], "month": row[1], "week_of_month": row[2], "unreleased_count": row[3], "last_week_count": row[4], "diff_from_last_week_unreleased": row[5]} for row in rows]
    return JsonResponse(unreleased, safe=False)

def work_order_list(request):
    # Raw SQL to query work orders
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
            wo_number,
            title,
            wo_created_at,
            status,
            resource,
            description,
            wo_type,
            engineer_id,
            wo_completion_date,
            actual_duration,
            EXTRACT(YEAR FROM wo_created_at) AS year,
            EXTRACT(MONTH FROM wo_created_at) AS month,
            FLOOR((EXTRACT(DAY FROM wo_created_at) - 1) / 7) + 1 AS week_of_month
        FROM engineering_app_workorder
        ORDER BY wo_created_at DESC;
        """)
        rows = cursor.fetchall()

    # Return results as JSON
    work_orders = [
        {
            "no": row[0],
            "title": row[1],
            "wo_created_date": row[2],
            "status": row[3],
            "resource": row[4],
            "wo_description": row[5],
            "wo_type": row[6],
            "engineer_id": row[7],
            "wo_completion_date": row[8],
            "actual_duration": row[9],
            "year": row[10],
            "month": row[11],
            "week_of_month": row[12]
        }
        for row in rows
    ]
    return JsonResponse(work_orders, safe=False)

def work_request_list(request):
    with connection.cursor() as cursor:
        cursor.execute("""
           SELECT
                wr_number,
                title,
                wo_description,
                resource,
                wr_type,
                wr_request_by_date,
                wr_requestor,
                EXTRACT(YEAR FROM wr_request_by_date) AS year,
                EXTRACT(MONTH FROM wr_request_by_date) AS month,
                FLOOR((EXTRACT(DAY FROM wr_request_by_date) - 1) / 7) + 1 AS week_of_month
            FROM main_data
            WHERE wr_request_by_date is not null
            ORDER BY wr_request_by_date DESC;
        """)
        rows = cursor.fetchall()

    work_request = [
        {
            "wr_number": row[0],
            "title": row[1],
            "wo_description": row[2],
            "resource": row[3],
            "wr_type": row[4],
            "wo_request_by_date": row[5],
            "wr_requestor": row[6],
            "year": row[7],
            "month": row[8],
            "week_of_month": row[9]
        }
        for row in rows
    ]
    return JsonResponse(work_request, safe=False)

def energy (request):
    with connection.cursor() as cursor:
        cursor.execute("""
           SELECT 
                a.date, 
                a.daily_consumption*100 AS water_consumption, 
                b.daily_consumption AS cng_consumption, 
                c.daily_consumption AS electricity_consumption,
                EXTRACT(YEAR FROM a.date) AS year,
                EXTRACT(MONTH FROM a.date) AS month,
                FLOOR((EXTRACT(DAY FROM a.date) - 1) / 7) + 1 AS week_of_month,
                EXTRACT(DAY FROM a.date) AS day
            FROM 
                water_daily a
            LEFT JOIN 
                cng_daily b ON a.date = b.date
            LEFT JOIN 
                electricity_daily c ON a.date = c.date
            ORDER BY a.date DESC;
        """)
        rows = cursor.fetchall()

    water_data = [
        {"date": row[0], "water_consumption": row[1], "cng_consumption": row[2], "electricity_consumption": row[3], "year": row[4], "month": row[5], "week_of_month": row[6]}
        for row in rows
    ]
    return JsonResponse(water_data, safe=False)

def energyTrend(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT  
                TO_CHAR(a.date, 'FMMonth') AS month_name,
                round(avg(a.daily_consumption*100)) AS water_monthly, 
                round(avg(b.daily_consumption)) AS cng_monthly, 
                round(avg(c.daily_consumption)) AS electricity_monthly,
				EXTRACT(MONTH from a.date) as month_number
            FROM 
                water_daily a
            LEFT JOIN 
                cng_daily b ON a.date = b.date
            LEFT JOIN 
                electricity_daily c ON a.date = c.date
			group by month_name, month_number
            ORDER BY month_number 
        """)
        rows = cursor.fetchall()

    energy_trend_data = [
        {"month_name": row[0], "water_monthly": row[1], "cng_monthly": row[2], "electricity_monthly": row[3], "month_number": row[4]}
        for row in rows
    ]
    return JsonResponse(energy_trend_data, safe=False)

def analytic(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            WITH 
            mttr_data AS (
                SELECT 
                    DATE(wo_scheduled_start_date) AS date,
                    ROUND(AVG(EXTRACT(EPOCH FROM (wo_scheduled_completion_date - wo_scheduled_start_date)) / 3600), 2) AS mttr_hours
                FROM main_data
                WHERE wo_scheduled_start_date IS NOT NULL 
                  AND wo_scheduled_completion_date IS NOT NULL
                GROUP BY DATE(wo_scheduled_start_date)
            ),
            
            failure_dates AS (
                SELECT 
                    MIN(actual_failure_date) AS failure_time
                FROM main_data
                WHERE actual_failure_date IS NOT NULL
                GROUP BY DATE(actual_failure_date), no_asset_of_wo
            ),
            
            failure_with_diff AS (
                SELECT 
                    failure_time,
                    failure_time - LAG(failure_time) OVER (ORDER BY failure_time) AS diff
                FROM failure_dates
            ),
            
            mtbf_data AS (
                SELECT 
                    DATE(failure_time) AS date,
                    ROUND(AVG(EXTRACT(EPOCH FROM diff) / 3600), 2) AS mtbf_hours,
                    COUNT(*) AS failure_count
                FROM failure_with_diff
                WHERE diff IS NOT NULL
                GROUP BY DATE(failure_time)
            )
            
            SELECT 
                COALESCE(mttr_data.date, mtbf_data.date) AS date,
                mttr_data.mttr_hours,
                mtbf_data.mtbf_hours,
                mtbf_data.failure_count
            FROM mttr_data
            FULL OUTER JOIN mtbf_data ON mttr_data.date = mtbf_data.date
            ORDER BY date;
        """)
        rows = cursor.fetchall()

    result = [
        {
            "date": str(row[0]),
            "mttr_hours": row[1],
            "mtbf_hours": row[2],
            "failure_count": row[3]
        }
        for row in rows
    ]

    return JsonResponse(result, safe=False)

def category_analytics(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            WITH valid_mttr AS (
    SELECT
        resource,
        DATE_TRUNC('month', wo_actual_start_date) AS month,
        ROUND(AVG(EXTRACT(EPOCH FROM (wo_actual_completion_date - wo_actual_start_date)) / 3600), 1) AS avg_mttr_hours
    FROM main_data
    WHERE wo_actual_start_date IS NOT NULL
      AND wo_actual_completion_date IS NOT NULL
      AND wo_actual_completion_date >= wo_actual_start_date
      AND DATE_PART('year', wo_actual_start_date) = 2025
      AND resource IS NOT NULL
    GROUP BY resource, DATE_TRUNC('month', wo_actual_start_date)
),

valid_mtbf_raw AS (
    SELECT
        resource,
        actual_failure_date,
        DATE_TRUNC('month', actual_failure_date) AS month,
        LAG(actual_failure_date) OVER (PARTITION BY resource ORDER BY actual_failure_date) AS prev_failure_date
    FROM main_data
    WHERE actual_failure_date IS NOT NULL
      AND DATE_PART('year', actual_failure_date) = 2025
      AND resource IS NOT NULL
),

valid_mtbf AS (
    SELECT
        resource,
        DATE_TRUNC('month', actual_failure_date) AS month,
        ROUND(AVG(EXTRACT(EPOCH FROM (actual_failure_date - prev_failure_date)) / 3600), 1) AS avg_mtbf_hours
    FROM valid_mtbf_raw
    WHERE prev_failure_date IS NOT NULL
    GROUP BY resource, DATE_TRUNC('month', actual_failure_date)
),

work_orders AS (
    SELECT
        resource,
        DATE_TRUNC('month', wo_actual_start_date) AS month,
        COUNT(*) AS work_order_count
    FROM main_data
    WHERE resource IS NOT NULL
      AND wo_actual_start_date IS NOT NULL
      AND DATE_PART('year', wo_actual_start_date) = 2025
    GROUP BY resource, DATE_TRUNC('month', wo_actual_start_date)
)

SELECT 
    wo.resource,
    wo.month,
    wo.work_order_count,
    COALESCE(mt.avg_mttr_hours, 0) AS mttr,
    COALESCE(mb.avg_mtbf_hours, 0) AS mtbf
FROM work_orders wo
LEFT JOIN valid_mttr mt ON wo.resource = mt.resource AND wo.month = mt.month
LEFT JOIN valid_mtbf mb ON wo.resource = mb.resource AND wo.month = mb.month
ORDER BY wo.resource, wo.month;
        """)

        rows = cursor.fetchall()

    result = [
        {
            "category": row[0],
            "date": row[1],
            "count": row[2],
            "avgMttr": row[3],
            "avgMtbf": row[4],
        }
        for row in rows
    ]

    return JsonResponse(result, safe=False)

def equipment_analytics(request):
    with connection.cursor() as cursor:
        cursor.execute("""
                        WITH valid_mttr AS (
            SELECT
                asset_group,
                ROUND(AVG(EXTRACT(EPOCH FROM (wo_actual_completion_date - wo_actual_start_date)) / 3600), 1) AS mttr
            FROM main_data
            WHERE wo_actual_start_date IS NOT NULL AND wo_actual_completion_date IS NOT NULL
            GROUP BY asset_group
            ),
            valid_mtbf_raw AS (
            SELECT
                asset_group,
                actual_failure_date,
                LAG(actual_failure_date) OVER (PARTITION BY asset_group ORDER BY actual_failure_date) AS prev_failure
            FROM main_data
            WHERE actual_failure_date IS NOT NULL
            ),
            valid_mtbf AS (
            SELECT
                asset_group,
                ROUND(AVG(EXTRACT(EPOCH FROM (actual_failure_date - prev_failure)) / 3600), 1) AS mtbf
            FROM valid_mtbf_raw
            WHERE prev_failure IS NOT NULL
            GROUP BY asset_group
            ),
            failures AS (
            SELECT asset_group, COUNT(*) AS failure_count
            FROM main_data
            WHERE actual_failure_date IS NOT NULL
            GROUP BY asset_group
            )

            SELECT 
            f.asset_group,
            COALESCE(m.mttr, 0) AS mttr,
            COALESCE(b.mtbf, 0) AS mtbf,
            f.failure_count
            FROM failures f
            LEFT JOIN valid_mttr m ON f.asset_group = m.asset_group
            LEFT JOIN valid_mtbf b ON f.asset_group = b.asset_group
            WHERE f.asset_group IS NOT NULL
            ORDER BY f.failure_count DESC
            LIMIT 10;

        """)
        rows = cursor.fetchall()

    result = [
        {
            "equipment": row[0],       # asset_group
            "mttr": row[1],            # avg_mttr
            "mtbf": row[2],            # avg_mtbf
            "failures": row[3],        # count
        }
        for row in rows
    ]

    return JsonResponse(result, safe=False)

def monthly_trend(request):
    with connection.cursor() as cursor:
        cursor.execute("""
       WITH monthly_mttr AS (
    SELECT 
        TO_CHAR(wo_actual_start_date, 'YYYY-MM') AS month,
        ROUND(AVG(EXTRACT(EPOCH FROM (wo_actual_completion_date - wo_actual_start_date)) / 3600), 1) AS avg_mttr,
        COUNT(*) AS work_orders
    FROM main_data
    WHERE wo_actual_start_date IS NOT NULL 
      AND wo_actual_completion_date IS NOT NULL
      AND wo_actual_start_date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY TO_CHAR(wo_actual_start_date, 'YYYY-MM')
),

mtbf_raw AS (
    SELECT 
        actual_failure_date,
        TO_CHAR(actual_failure_date, 'YYYY-MM') AS month,
        LAG(actual_failure_date) OVER (ORDER BY actual_failure_date) AS prev_date
    FROM main_data
    WHERE actual_failure_date IS NOT NULL
      AND actual_failure_date >= CURRENT_DATE - INTERVAL '6 months'
),

monthly_mtbf AS (
    SELECT 
        month,
        ROUND(AVG(EXTRACT(EPOCH FROM (actual_failure_date - prev_date)) / 3600), 1) AS avg_mtbf
    FROM mtbf_raw
    WHERE prev_date IS NOT NULL
    GROUP BY month
)

SELECT 
    mttr.month,
    mttr.avg_mttr,
    mtbf.avg_mtbf,
    mttr.work_orders
FROM monthly_mttr mttr
LEFT JOIN monthly_mtbf mtbf ON mttr.month = mtbf.month
ORDER BY mttr.month;


        """)
        rows = cursor.fetchall()

    result = [
        {
            "month": row[0],  # Format 'YYYY-MM'
            "mttr": row[1],
            "mtbf": row[2],
            "workOrders": row[3],
        }
        for row in rows
    ]
    return JsonResponse(result, safe=False)

def weekly_downtime(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
  DATE_TRUNC('week', wo_actual_start_date) AS week,

  -- Planned downtime in hours (based on WO types)
  ROUND(SUM(CASE 
    WHEN wo_type IN (
      'Preventive Maintenance', 
      'Predictive Maintenance', 
      'Planned Maintenance', 
      'Calibration'
    ) THEN actual_duration / 3600.0
    ELSE 0
  END)::numeric, 2) AS planned_hours,

  -- Unplanned downtime in hours (other or null WO types)
  ROUND(SUM(CASE 
    WHEN wo_type IS NULL 
      OR wo_type NOT IN (
        'Preventive Maintenance', 
        'Predictive Maintenance', 
        'Planned Maintenance', 
        'Calibration'
      ) THEN actual_duration / 3600.0
    ELSE 0
  END)::numeric, 2) AS unplanned_hours,

  -- Total downtime in hours
  ROUND(SUM(actual_duration / 3600.0)::numeric, 2) AS total_hours

FROM main_data
WHERE 
  wo_actual_start_date IS NOT NULL
  AND actual_duration IS NOT NULL
  AND actual_duration BETWEEN 1 AND 10000000

GROUP BY DATE_TRUNC('week', wo_actual_start_date)
ORDER BY week;

        """)
        rows = cursor.fetchall()

    result = [
        {
            "week": row[0].strftime("%Y-%m-%d"),
            "planned": float(row[1]),
            "unplanned": float(row[2]),
            "total": float(row[3]),
        }
        for row in rows
    ]

    return JsonResponse(result, safe=False)

def energydaily(request):
    with connection.cursor() as cursor:
        cursor.execute("""
             SELECT *
FROM (
    SELECT 
        a.date,
        CASE 
            WHEN TO_CHAR(a.date, 'DY') IN ('Mon', 'MON') THEN 'Sen'
            WHEN TO_CHAR(a.date, 'DY') IN ('Tue', 'TUE') THEN 'Sel'
            WHEN TO_CHAR(a.date, 'DY') IN ('Wed', 'WED') THEN 'Rab'
            WHEN TO_CHAR(a.date, 'DY') IN ('Thu', 'THU') THEN 'Kam'
            WHEN TO_CHAR(a.date, 'DY') IN ('Fri', 'FRI') THEN 'Jum'
            WHEN TO_CHAR(a.date, 'DY') IN ('Sat', 'SAT') THEN 'Sab'
            WHEN TO_CHAR(a.date, 'DY') IN ('Sun', 'SUN') THEN 'Min'
            ELSE TO_CHAR(a.date, 'DY')
        END AS name,
        c.daily_consumption AS listrik,
        a.daily_consumption * 100 AS air,
        b.daily_consumption AS cng
    FROM 
        water_daily a
    LEFT JOIN 
        cng_daily b ON a.date = b.date
    LEFT JOIN 
        electricity_daily c ON a.date = c.date
    ORDER BY a.date DESC
    LIMIT 7
) AS recent_data
ORDER BY date ASC;

        """)
        rows = cursor.fetchall()

    result = [
            {"name": row[1], "listrik": float(row[2]), "air": float(row[3]), "cng": float(row[4])}
            for row in rows
    ]

    return JsonResponse(result, safe=False)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from .models import EnergyInput
from .serializers import EnergyInputSerializer

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .serializers import EnergyInputSerializer

from rest_framework.parsers import MultiPartParser, FormParser

class EnergySubmitView(APIView):
    parser_classes = [MultiPartParser, FormParser]  # Tambahkan ini
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EnergyInputSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)

            # kirim email jika ada
            email = request.data.get("email_recipient")
            if email:
                send_mail(
                    "Energy Input Notification",
                    f"Data {request.data.get('type')} masuk oleh {request.user.username}.",
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                )

            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

from rest_framework.parsers import MultiPartParser, FormParser

class EnergyInputCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # WAJIB untuk FormData

    def post(self, request):
        serializer = EnergyInputSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            instance = serializer.save(user=request.user)
            log_audit_action(
                user=request.user,
                action="input",
                model_name="EnergyInput",
                object_id=str(instance.id),
                description=f"Input energi {instance.type} tanggal {instance.date} meter {instance.meter_number}"
            )

            # Ambil email tujuan dari FormData
            email_to = request.user.email
            if email_to:
                send_mail(
                    subject=f"[Energy Input] {instance.type} - {instance.date}",
                    message=(
                        f"Ada Input baru yang dikirim oleh {request.user.get_full_name()} ({request.user.email})\n\n"
                        f"Tanggal: {instance.date}\n"
                        f"Kategori: {instance.type}\n"
                        f"Nilai: {instance.value}\n"
                        f"No Meter: {instance.meter_number}\n"
                        f"User: {request.user.username}"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email_to],
                    fail_silently=True,
                )

            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    
class UserEnergyInputListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        inputs = EnergyInput.objects.filter(user=request.user).order_by('-created_at')
        serializer = EnergyInputSerializer(inputs, many=True)
        return Response(serializer.data)

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import EnergyInput
from .serializers import EnergyInputSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def latest_energy_inputs(request):
    latest_inputs = EnergyInput.objects.filter(user=request.user).order_by('-created_at')[:5]
    serializer = EnergyInputSerializer(latest_inputs, many=True)
    return Response(serializer.data)

# views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from .models import AuditTrail
from django.utils import timezone
from django.contrib.auth.models import User

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .serializers import CustomTokenObtainPairSerializer
from .models import AuditTrail
from django.contrib.auth.models import User


from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UserProfile

class UserStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user_profile = getattr(user, "userprofile", None)

        if not user_profile:
            return Response({"error": "UserProfile not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        if new_status not in ["Active", "Inactive"]:
            return Response({"error": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)

        user_profile.status = new_status
        user_profile.save()

        return Response({"message": f"User status updated to {new_status}."}, status=status.HTTP_200_OK)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated

class ResetUserPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        print("DEBUG Request data:", request.data)  # untuk debug console

        user = get_object_or_404(User, pk=pk)
        new_password = request.data.get("new_password")

        if not new_password:
            return Response({"error": "New password is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 6:
            return Response({"error": "Password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password successfully updated."}, status=status.HTTP_200_OK)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Document
from .serializers import DocumentSerializer


class DocumentUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]


    def post(self, request):
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def get(self, request):  
        user = request.user
        if user.userprofile.role == "admin":
            docs = Document.objects.all().order_by('-uploaded_at')
        else:
            docs = Document.objects.filter(uploaded_by=user).order_by('-uploaded_at')


        serializer = DocumentSerializer(docs, many=True)
        return Response(serializer.data)
   
    def delete(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
           
            # Hanya admin atau user yang mengupload yang bisa delete
            if request.user.userprofile.role != "admin" and doc.uploaded_by != request.user:
                return Response({"error": "You don't have permission to delete this document"},
                              status=status.HTTP_403_FORBIDDEN)
           
            doc.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)




# Optional: bisa dihapus kalau fungsinya sudah dipindahkan ke atas
class DocumentListView(APIView):
    permission_classes = [permissions.IsAuthenticated]


    def get(self, request):
        docs = Document.objects.all().order_by('-uploaded_at')
        serializer = DocumentSerializer(docs, many=True)
        return Response(serializer.data)


class EnergyInputListView(APIView):
    permission_classes = [IsAuthenticated]


    def get(self, request):
        status_param = request.query_params.get("status")
        if status_param:
            queryset = EnergyInput.objects.filter(status=status_param)
        else:
            queryset = EnergyInput.objects.all()


        serializer = EnergyInputSerializer(queryset, many=True)
        return Response(serializer.data)


class AuditTrailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserProfile]


    def get(self, request):
        search_query = request.query_params.get('search', None)
       
        logs = LogEntry.objects.all().order_by('-action_time')
       
        if search_query:
            logs = logs.filter(
                Q(user__username__icontains=search_query) |
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(object_repr__icontains=search_query) |
                Q(change_message__icontains=search_query)
            )
           
        serializer = AuditTrailSerializer(logs, many=True)
        return Response(serializer.data)
   
def analytic(request):
    # Ambil query param
    period = request.GET.get("period", "6months")


    if period == "1month":
        interval = "30 days"
    elif period == "3months":
        interval = "90 days"
    elif period == "1year":
        interval = "365 days"
    else:  # default
        interval = "180 days"


    with connection.cursor() as cursor:
        cursor.execute(f"""
            WITH
            mttr_data AS (
                SELECT
                    DATE(wo_scheduled_start_date) AS date,
                    ROUND(AVG(EXTRACT(EPOCH FROM (wo_scheduled_completion_date - wo_scheduled_start_date)) / 3600), 2) AS mttr_hours
                FROM main_data
                WHERE wo_scheduled_start_date IS NOT NULL
                  AND wo_scheduled_completion_date IS NOT NULL
                  AND wo_scheduled_start_date >= CURRENT_DATE - INTERVAL '{interval}'
                GROUP BY DATE(wo_scheduled_start_date)
            ),
           
            failure_dates AS (
                SELECT
                    MIN(actual_failure_date) AS failure_time
                FROM main_data
                WHERE actual_failure_date IS NOT NULL
                  AND actual_failure_date >= CURRENT_DATE - INTERVAL '{interval}'
                GROUP BY DATE(actual_failure_date), no_asset_of_wo
            ),
           
            failure_with_diff AS (
                SELECT
                    failure_time,
                    failure_time - LAG(failure_time) OVER (ORDER BY failure_time) AS diff
                FROM failure_dates
            ),
           
            mtbf_data AS (
                SELECT
                    DATE(failure_time) AS date,
                    ROUND(AVG(EXTRACT(EPOCH FROM diff) / 3600), 2) AS mtbf_hours,
                    COUNT(*) AS failure_count
                FROM failure_with_diff
                WHERE diff IS NOT NULL
                GROUP BY DATE(failure_time)
            )
           
            SELECT
                COALESCE(mttr_data.date, mtbf_data.date) AS date,
                mttr_data.mttr_hours,
                mtbf_data.mtbf_hours,
                mtbf_data.failure_count
            FROM mttr_data
            FULL OUTER JOIN mtbf_data ON mttr_data.date = mtbf_data.date
            ORDER BY date;
        """)
        rows = cursor.fetchall()


    result = [
        {
            "date": str(row[0]),
            "mttr_hours": row[1],
            "mtbf_hours": row[2],
            "failure_count": row[3]
        }
        for row in rows
    ]


    return JsonResponse(result, safe=False)
 
from .models import AuditTrail
from .serializers import AuditTrailSerializer
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminUserProfile  # atau permission admin milikmu

class AuditTrailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserProfile]

    def get(self, request):
        logs = AuditTrail.objects.all().order_by("-timestamp")[:200]  # limit to latest 200 entries
        serializer = AuditTrailSerializer(logs, many=True)
        return Response(serializer.data, status=200)
    
class AuditTrailListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        audits = AuditTrail.objects.select_related("user").order_by("-timestamp")[:50]
        data = [
            {
                "id": audit.id,
                "user": audit.user.userprofile.full_name if hasattr(audit.user, "userprofile") else audit.user.username,
                "action": audit.action,
                "resource": audit.model_name,
                "timestamp": audit.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                
                "details": audit.description,
            }
            for audit in audits
        ]
        return Response(data)