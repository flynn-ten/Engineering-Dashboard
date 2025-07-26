from django.contrib.auth.models import User
from django.db import connection
from django.http import JsonResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import UserProfile
from .serializers import (
    UserSerializer,
    UserProfileWithUserSerializer,
)
from .permissions import IsAdminUserProfile


# ----------------------------
# 🔐 MeView & Auth
# ----------------------------

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
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

        UserProfile.objects.create(
            user=user,
            full_name=full_name,
            role=role,
            division=division if role == "requester" else ""
        )

        return Response({"message": "User created"}, status=201)


class DivisionListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        divisions = [
            "Halal Representative", "HSSE", "IT", "PD", "DP", "DS",
            "QA", "QC", "EN", "QSC", "RD", "WH"
        ]
        return Response(divisions)


# ----------------------------
# 👥 User List & Stats
# ----------------------------

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
        return Response({
            "total_users": users.count(),
            "active_users": users.filter(userprofile__status="Active").count()
        })


# ----------------------------
# 📊 SQL Raw Queries
# ----------------------------

def active_work_orders(request):
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
                year, month, week_of_month, released_count,
                LAG(released_count) OVER (PARTITION BY year, month ORDER BY week_of_month) AS last_week_count,
                released_count - COALESCE(LAG(released_count) OVER (PARTITION BY year, month ORDER BY week_of_month), 0) AS diff_from_last_week
            FROM weekly_complete
            ORDER BY year DESC, month DESC, week_of_month DESC;
        """)
        rows = cursor.fetchall()

    result = [
        {
            "year": row[0], "month": row[1], "week_of_month": row[2],
            "released_count": row[3], "last_week_count": row[4], "diff_from_last_week": row[5]
        } for row in rows
    ]
    return JsonResponse(result, safe=False)


def unreleased_work_orders(request):
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
                year, month, week_of_month, unreleased_count,
                LAG(unreleased_count) OVER (PARTITION BY year, month ORDER BY week_of_month) AS last_week_count,
                unreleased_count - COALESCE(LAG(unreleased_count) OVER (PARTITION BY year, month ORDER BY week_of_month), 0) AS diff_from_last_week_unreleased
            FROM weekly_complete
            ORDER BY year DESC, month DESC, week_of_month DESC;
        """)
        rows = cursor.fetchall()

    result = [
        {
            "year": row[0], "month": row[1], "week_of_month": row[2],
            "unreleased_count": row[3], "last_week_count": row[4], "diff_from_last_week_unreleased": row[5]
        } for row in rows
    ]
    return JsonResponse(result, safe=False)


def work_order_list(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                no, title, wo_created_date, wo_status, resource,
                wo_description, wo_type, wr_requestor, wo_actual_completion_date,
                actual_duration, EXTRACT(YEAR FROM wo_created_date),
                EXTRACT(MONTH FROM wo_created_date),
                FLOOR((EXTRACT(DAY FROM wo_created_date) - 1) / 7) + 1
            FROM main_data
            ORDER BY wo_created_date DESC;
        """)
        rows = cursor.fetchall()

    result = [
        {
            "no": row[0], "title": row[1], "wo_created_date": row[2], "wo_status": row[3],
            "resource": row[4], "wo_description": row[5], "wo_type": row[6], "wr_requestor": row[7],
            "wo_actual_completion_date": row[8], "actual_duration": row[9],
            "year": row[10], "month": row[11], "week_of_month": row[12]
        } for row in rows
    ]
    return JsonResponse(result, safe=False)


def work_request_list(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                wr_number, title, wo_description, resource, wr_type,
                wr_request_by_date, wr_requestor,
                EXTRACT(YEAR FROM wr_request_by_date),
                EXTRACT(MONTH FROM wr_request_by_date),
                FLOOR((EXTRACT(DAY FROM wr_request_by_date) - 1) / 7) + 1
            FROM main_data
            WHERE wr_request_by_date IS NOT NULL
            ORDER BY wr_request_by_date DESC;
        """)
        rows = cursor.fetchall()

    result = [
        {
            "wr_number": row[0], "title": row[1], "wo_description": row[2], "resource": row[3],
            "wr_type": row[4], "wo_request_by_date": row[5], "wr_requestor": row[6],
            "year": row[7], "month": row[8], "week_of_month": row[9]
        } for row in rows
    ]
    return JsonResponse(result, safe=False)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import WorkRequest
from .serializers import WorkRequestSerializer

class WorkRequestCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WorkRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(requested_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user_profile = user.userprofile
            status = request.data.get("status")
            if status in ["Active", "Inactive"]:
                user_profile.status = status
                user_profile.save()
                return Response({"message": "Status updated successfully"})
            return Response({"error": "Invalid status"}, status=400)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        
        
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser  # ✅ tambahkan ini

from .serializers import EnergyInputSerializer
from .models import EnergyInput


class EnergyInputCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = EnergyInputSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)  # ✅ inject user langsung di save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserEnergyInputListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        energy_type = request.query_params.get('type')  # filter: listrik, air, cng
        inputs = EnergyInput.objects.filter(user=request.user)
        if energy_type:
            inputs = inputs.filter(type=energy_type)
        serializer = EnergyInputSerializer(inputs.order_by('-created_at'), many=True)
        return Response(serializer.data)

class TodayEnergyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        data = []

        for energy_type in ["listrik", "air", "cng"]:
            entries = EnergyInput.objects.filter(
                user=request.user,
                date=today,
                type=energy_type
            )
            total_value = entries.aggregate(total=Sum("value"))["total"] or 0
            data.append({
                "type": energy_type,
                "current": float(total_value),
                "budget": 100,  # default budget, bisa kamu sesuaikan
                "unit": "kWh" if energy_type == "listrik" else "m³"
            })

        return Response(data)