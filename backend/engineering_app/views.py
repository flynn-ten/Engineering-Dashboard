from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from django.db import connection

from .models import UserProfile, active_work_orders
from .serializers import UserSerializer

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print("DEBUG:", request.user, request.user.userprofile.role)
        serializer = UserSerializer(request.user)
        return Response(serializer.data)



class RegisterUserView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        if request.user.userprofile.role != 'admin':
            return Response({"error": "Unauthorized"}, status=403)

        username = request.data.get("username")
        password = request.data.get("password")
        role = request.data.get("role")
        division = request.data.get("division", "")

        if not username or not password or not role:
            return Response({"error": "All fields required"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=400)

        user = User.objects.create_user(username=username, password=password)
        if role == "requester":
            UserProfile.objects.create(user=user, role=role, division=division)
        else:
            UserProfile.objects.create(user=user, role=role)

        return Response({"message": "User created"}, status=201)

class DivisionListView(APIView):
    def get(self, request):
        divisions = ['Produksi', 'QA', 'R&D', 'Maintenance']
        return Response(divisions)

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