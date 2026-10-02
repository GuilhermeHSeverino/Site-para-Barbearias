
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path,include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('barber.urls')),
    path('api/v1/', include('client.urls')),
    path('api/v1/', include('reviews.urls')),
    path('api/v1/', include('services.urls')),
    path('api/v1/', include('schedule.urls')),
    path('api/v1/', include('products.urls')),
    path('api/v1/', include('stock.urls')),
    path('api/v1/', include('store.urls')),
    path('api/v1/', include('finance.urls')),
        path('api/v1/', include('notifications.urls')),
    path('api/v1/', include('authentication.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
