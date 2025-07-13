from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import UserProfile
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
