from django.urls import path,include
from rest_framework import routers
from .views import TodoviewSet

router = routers.DefaultRouter()
router.register('todos', TodoviewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]