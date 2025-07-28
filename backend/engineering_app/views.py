from django.utils import timezone  
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from .permissions import IsAdminUserProfile
from .serializers import UserProfileWithUserSerializer, WorkOrderSerializer, WorkOrderStatusSerializer, WorkOrderUpdateSerializer
from .serializers import UserProfileSerializer
from django.http import JsonResponse
from django.db import connection
import pandas as pd
from rest_framework import permissions
from .models import WorkOrder, WorkRequest
from rest_framework.decorators import api_view
from rest_framework import generics
from rest_framework.generics import RetrieveUpdateAPIView




from .models import UserProfile, active_work_orders, analytics
from .serializers import UserSerializer
from .serializers import WorkRequestSerializer
from rest_framework import permissions


class WorkOrderDetailAPIView(RetrieveUpdateAPIView):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderUpdateSerializer
    permission_classes = [IsAuthenticated]

class WorkOrderListCreateAPIView(generics.ListCreateAPIView):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [permissions.IsAuthenticated]


# 2. Status change (release/complete)
class WorkOrderStatusUpdateAPIView(generics.UpdateAPIView):
    queryset = WorkRequest.objects.all()
    serializer_class = WorkOrderStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        status_value = request.data.get("wo_status")

        if status_value == "released" and not instance.wo_start_date:
            instance.wo_status = "released"
            instance.wo_start_date = timezone.now()

        elif status_value == "completed" and not instance.wo_completion_date:
            instance.wo_status = "completed"
            instance.wo_completion_date = timezone.now()
            if instance.wo_start_date:
                instance.actual_duration = instance.wo_completion_date - instance.wo_start_date

        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class WorkOrderUpdateAPIView(generics.UpdateAPIView):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "wo_number"  # or 'id' if you're using numeric ID

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if not serializer.is_valid():
            print("🔥 Validation Error:", serializer.errors)
            return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)
        return Response(serializer.data)
    
    

class WorkOrderStatusUpdateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, wo_number):
        try:
            wo = WorkOrder.objects.get(wo_number=wo_number)
        except WorkOrder.DoesNotExist:
            return Response({"error": "Work Order not found"}, status=404)

        serializer = WorkOrderStatusSerializer(wo, data=request.data, partial=True)
        if serializer.is_valid():
            new_status = serializer.validated_data.get("wo_status")
            now = timezone.now()

            if new_status == "released" and not wo.wo_start_date:
                wo.wo_start_date = now

            if new_status == "completed" and not wo.wo_completion_date:
                wo.wo_completion_date = now
                if wo.wo_start_date:
                    wo.actual_duration = now - wo.wo_start_date

            wo.wo_status = new_status
            wo.save()
            return Response(WorkOrderStatusSerializer(wo).data)

        return Response(serializer.errors, status=400)
        
class WorkRequestStatusUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            wr = WorkRequest.objects.get(pk=pk)
        except WorkRequest.DoesNotExist:
            return Response({"error": "Work Request not found."}, status=404)

        new_status = request.data.get("status")
        if new_status not in ["approved", "rejected"]:
            return Response({"error": "Invalid status value"}, status=400)

        wr.status = new_status
        if new_status == "approved":
            from django.utils import timezone
            wr.approved_at = timezone.now()
            WorkOrder.objects.create(work_request=wr)

        wr.save()
        return Response({"message": f"Status updated to {new_status}"}, status=200)
    
    def patch(self, request, pk):
        wr = get_object_or_404(WorkRequest, pk=pk)
        new_status = request.data.get("status")

        if new_status:
            wr.status = new_status
            wr.save()

            # ✅ Jika status baru adalah "approved", buat WorkOrder
            if new_status == "approved":
                # Cek dulu supaya tidak buat duplikat WO
                if not hasattr(wr, "work_order"):
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

                        work_request=wr
                    )

        return Response({"message": f"Status updated to {new_status}"})

class WorkRequestCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = WorkRequestSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()  # requested_by sudah diset di serializer
            return Response(serializer.data, status=status.HTTP_201_CREATED)
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
                EXTRACT(YEAR FROM wo_created_date)::INT AS year,
                EXTRACT(MONTH FROM wo_created_date)::INT AS month,
                FLOOR((EXTRACT(DAY FROM wo_created_date) - 1) / 7) + 1 AS week_of_month,
                COUNT(*) AS released_count
            FROM main_data
            WHERE wo_status = 'Released'
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
                EXTRACT(YEAR FROM wo_created_date)::INT AS year,
                EXTRACT(MONTH FROM wo_created_date)::INT AS month,
                FLOOR((EXTRACT(DAY FROM wo_created_date) - 1) / 7) + 1 AS week_of_month,
                COUNT(*) AS unreleased_count
            FROM main_data
            WHERE wo_status = 'Unreleased'
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
            no,
            title,
            wo_created_date,
            wo_status,
            resource,
            wo_description,
            wo_type,
            wr_requestor,
            wo_actual_completion_date,
            actual_duration,
            EXTRACT(YEAR FROM wo_created_date) AS year,
            EXTRACT(MONTH FROM wo_created_date) AS month,
            FLOOR((EXTRACT(DAY FROM wo_created_date) - 1) / 7) + 1 AS week_of_month
        FROM main_data
        ORDER BY wo_created_date DESC;
        """)
        rows = cursor.fetchall()

    # Return results as JSON
    work_orders = [
        {
            "no": row[0],
            "title": row[1],
            "wo_created_date": row[2],
            "wo_status": row[3],
            "resource": row[4],
            "wo_description": row[5],
            "wo_type": row[6],
            "wr_requestor": row[7],
            "wo_actual_completion_date": row[8],
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
                id,
                wr_number,
                title,
                description,
                wr_type,
                requested_by_id,
                status,
                EXTRACT(YEAR FROM created_at) AS year,
                EXTRACT(MONTH FROM created_at) AS month,
                FLOOR((EXTRACT(DAY FROM created_at) - 1) / 7) + 1 AS week_of_month,
                completion_by_date
            FROM engineering_app_workrequest
            WHERE created_at is not null
            ORDER BY created_at DESC;
        """)
        rows = cursor.fetchall()

    work_request = [
        {
            "id": row[0],
            "wr_number": row[1],
            "title": row[2],
            "description": row[3],
            "wr_type": row[4],
            "wo_request_by_id": row[5],
            "status": row[6],
            "year": row[7],
            "month": row[8],
            "week_of_month": row[9],
            "completion_by_date": row[10]
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
                    ROUND(AVG(EXTRACT(EPOCH FROM (wo_actual_completion_date - wo_actual_start_date)) / 3600), 1) AS avg_mttr_hours
                FROM main_data
                WHERE wo_actual_start_date IS NOT NULL
                  AND wo_actual_completion_date IS NOT NULL
                  AND wo_actual_completion_date >= wo_actual_start_date
                  AND resource IN ('MTC', 'CAL', 'UTY')
                GROUP BY resource
            ),

            valid_mtbf_raw AS (
                SELECT
                    resource,
                    actual_failure_date,
                    LAG(actual_failure_date) OVER (PARTITION BY resource ORDER BY actual_failure_date) AS prev_failure_date
                FROM main_data
                WHERE actual_failure_date IS NOT NULL
                  AND resource IN ('MTC', 'CAL', 'UTY')
            ),

            valid_mtbf AS (
                SELECT
                    resource,
                    ROUND(AVG(EXTRACT(EPOCH FROM (actual_failure_date - prev_failure_date)) / 3600), 1) AS avg_mtbf_hours
                FROM valid_mtbf_raw
                WHERE prev_failure_date IS NOT NULL
                GROUP BY resource
            ),

            work_orders AS (
                SELECT
                    resource,
                    COUNT(*) AS work_order_count
                FROM main_data
                WHERE resource IN ('MTC', 'CAL', 'UTY')
                GROUP BY resource
            )

            SELECT 
                wo.resource,
                wo.work_order_count,
                COALESCE(mt.avg_mttr_hours, 0),
                COALESCE(mb.avg_mtbf_hours, 0)
            FROM work_orders wo
            LEFT JOIN valid_mttr mt ON wo.resource = mt.resource
            LEFT JOIN valid_mtbf mb ON wo.resource = mb.resource;
        """)

        rows = cursor.fetchall()

    result = [
        {
            "category": row[0],
            "count": row[1],
            "avgMttr": row[2],
            "avgMtbf": row[3],
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
        WHERE wo_actual_start_date IS NOT NULL AND wo_actual_completion_date IS NOT NULL
        GROUP BY TO_CHAR(wo_actual_start_date, 'YYYY-MM')
        ),

        mtbf_raw AS (
        SELECT 
            actual_failure_date,
            TO_CHAR(actual_failure_date, 'YYYY-MM') AS month,
            LAG(actual_failure_date) OVER (ORDER BY actual_failure_date) AS prev_date
        FROM main_data
        WHERE actual_failure_date IS NOT NULL
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

              ROUND(SUM(CASE 
                WHEN wo_type IN (
                  'Preventive Maintenance', 
                  'Predictive Maintenance', 
                  'Planned Maintenance', 
                  'Calibration'
                ) THEN actual_duration / 3600.0
                ELSE 0
              END)::numeric, 2) AS planned_hours,

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

  
