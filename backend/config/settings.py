"""
Django settings for the skeleton project.

For more information on this file, see
https://docs.djangoproject.com/en/6.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/6.1/ref/settings/
"""

import configparser
import os
from datetime import timedelta
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

config = configparser.ConfigParser()
config.read(os.path.join(BASE_DIR, "skeleton.config"))


def env_or_config(env_key, config_key, default=None, section='database'):
    """Environment variables win (container deployments); the local
    skeleton.config INI file is the fallback for local dev."""
    value = os.environ.get(env_key)
    if value is not None:
        return value
    if config.has_section(section):
        return config.get(section, config_key, fallback=default)
    return default


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-change-me-before-any-real-deployment',
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

ALLOWED_HOSTS = [h.strip() for h in os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',') if h.strip()]


# Application definition

INSTALLED_APPS = [
    # daphne must come before django.contrib.staticfiles so its ASGI
    # runserver (HTTP + WebSocket) replaces Django's WSGI one.
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'django_extensions',
    'django_filters',
    'corsheaders',
    'simple_history',
    'channels',
    'core.apps.CoreConfig',
    'account.apps.AccountConfig',
    # Add your own apps here.
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
]

AUTH_USER_MODEL = 'account.AccountUser'

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'


# Database
# https://docs.djangoproject.com/en/6.1/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env_or_config("DB_NAME", "DB_NAME"),
        "USER": env_or_config("DB_USER", "DB_USER"),
        "PASSWORD": env_or_config("DB_PASSWORD", "DB_PASSWORD"),
        "HOST": env_or_config("DB_HOST", "DB_HOST"),
        "PORT": env_or_config("DB_PORT", "DB_PORT"),
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Source strings in the codebase are English (see gettext_lazy usage
# throughout); add other locale catalogs under locale/<lang>/LC_MESSAGES/.
LOCALE_PATHS = [BASE_DIR / 'locale']


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.1/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'


# Media files

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'


# SeaweedFS (generic object storage through its S3 gateway — see the storage
# helpers in core/helpers.py). Optional: remove this section, those helpers
# and the `boto3` package from requirements.txt if the project doesn't need
# object storage.

SEAWEEDFS_S3_ENDPOINT = env_or_config(
    'SEAWEEDFS_S3_ENDPOINT', 'SEAWEEDFS_S3_ENDPOINT', default='http://localhost:8333', section='seaweedfs',
)
SEAWEEDFS_ACCESS_KEY = env_or_config('SEAWEEDFS_ACCESS_KEY', 'SEAWEEDFS_ACCESS_KEY', section='seaweedfs')
SEAWEEDFS_SECRET_KEY = env_or_config('SEAWEEDFS_SECRET_KEY', 'SEAWEEDFS_SECRET_KEY', section='seaweedfs')
SEAWEEDFS_BUCKET = env_or_config('SEAWEEDFS_BUCKET', 'SEAWEEDFS_BUCKET', default='skeleton', section='seaweedfs')
SEAWEEDFS_REGION = env_or_config('SEAWEEDFS_REGION', 'SEAWEEDFS_REGION', default='us-east-1', section='seaweedfs')


# Redis (Celery broker on db 0, Channels layer on db 1)

REDIS_HOST = env_or_config('REDIS_HOST', 'REDIS_HOST', default='localhost', section='redis')
REDIS_PORT = env_or_config('REDIS_PORT', 'REDIS_PORT', default='6379', section='redis')


# Email
# https://docs.djangoproject.com/en/6.1/topics/email/#topic-email-configuration

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# Django REST Framework

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    # Needs rest_framework_simplejwt.token_blacklist (INSTALLED_APPS): without
    # it a rotated-out refresh token would stay valid until it expires.
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
}


# CORS (Angular dev server + whatever origin the frontend container serves in prod)

CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
] + [o.strip() for o in os.environ.get('DJANGO_CORS_ALLOWED_ORIGINS', '').split(',') if o.strip()]


# Celery (task queues and the beat schedule live in config/celery.py)

CELERY_BROKER_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/0'
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_ENABLE_UTC = True
CELERY_TIMEZONE = TIME_ZONE


# Channels (WebSocket — routes in config/routing.py, consumers in core/consumers.py)

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [f'redis://{REDIS_HOST}:{REDIS_PORT}/1'],
        },
    },
}
