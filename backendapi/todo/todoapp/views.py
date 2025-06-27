from django.shortcuts import render
from .serializers import TodoSerializer
from rest_framework import viewsets
from .models import Todo



# Create your views here.
class TodoviewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer

    # def get_queryset(self):
    #     queryset = super().get_queryset()
    #     completed = self.request.query_params.get('completed', None)
    #     if completed is not None:
    #         queryset = queryset.filter(completed=completed.lower() == 'true')
    #     return queryset
