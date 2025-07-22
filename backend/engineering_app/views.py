from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from .permissions import IsAdminUserProfile
from .serializers import UserProfileWithUserSerializer
from .serializers import UserProfileSerializer

from .models import UserProfile
from .serializers import UserSerializer

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

        # ✅ Validasi harus dilakukan sebelum create
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
        print("DEBUG: user =", request.user)
        divisions = ["Halal Representative", "HSSE", "IT", "PD", "DP", "DS","QA", "QC", "EN", "QSC", "RD", "WH"]
        return Response(divisions)


from rest_framework.views import APIView
from .serializers import UserProfileWithUserSerializer

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