# -*- coding: utf-8 -*-
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals
from celery.schedules import crontab

import os

from flask_appbuilder.security.manager import AUTH_OID

APP_NAME = 'Querent'

APP_ICON = '/static/assets/images/practo_logo_blue.png'

ENABLE_PROXY_FIX = False

AUTH_TYPE = AUTH_OID

OPENID_PROVIDERS = [
    {'name': 'Practo', 'url': ''}]

ENABLE_CORS = False

HTTP_HEADERS = {}

def get_env_variable(var_name, default=None):
    """Get the environment variable or raise exception."""
    try:
        return os.environ[var_name]
    except KeyError:
        if default is not None:
            return default
        else:
            error_msg = 'The environment variable {} was missing, abort...'\
                        .format(var_name)
            raise EnvironmentError(error_msg)


POSTGRES_USER = get_env_variable('POSTGRES_USER')
POSTGRES_PASSWORD = get_env_variable('POSTGRES_PASSWORD')
POSTGRES_HOST = get_env_variable('POSTGRES_HOST')
POSTGRES_PORT = get_env_variable('POSTGRES_PORT')
POSTGRES_DB = get_env_variable('POSTGRES_DB')

# The SQLAlchemy connection string.
SQLALCHEMY_DATABASE_URI = 'postgresql://%s:%s@%s:%s/%s' % (POSTGRES_USER,
                                                           POSTGRES_PASSWORD,
                                                           POSTGRES_HOST,
                                                           POSTGRES_PORT,
                                                           POSTGRES_DB)

REDIS_HOST = get_env_variable('REDIS_HOST')
REDIS_PORT = get_env_variable('REDIS_PORT')


class CeleryConfig(object):
    BROKER_URL = 'redis://%s:%s/0' % (REDIS_HOST, REDIS_PORT)
    CELERY_IMPORTS = ('superset.sql_lab', 'superset.tasks')
    CELERY_RESULT_BACKEND = 'redis://%s:%s/1' % (REDIS_HOST, REDIS_PORT)
    CELERYD_LOG_LEVEL = 'DEBUG'
    CELERYD_PREFETCH_MULTIPLIER = 10
    CELERY_ACKS_LATE = True
    CELERY_ANNOTATIONS = {
        'tasks.add': {
            'rate_limit': '10/s'
        },
        'sql_lab.get_sql_results': {
            'rate_limit': '100/s',
        },
        'email_reports.send': {
            'rate_limit': '1/s',
            'time_limit': 120,
            'soft_time_limit': 150,
            'ignore_result': True,
        },
    }
    CELERYBEAT_SCHEDULE = {
        'email_reports.schedule_hourly': {
            'task': 'email_reports.schedule_hourly',
            'schedule': crontab(minute=1, hour='*'),
        },
    }
    CELERY_TASK_PROTOCOL = 1


CELERY_CONFIG = CeleryConfig

CACHE_CONFIG = {
    'CACHE_TYPE': 'redis',
    'CACHE_DEFAULT_TIMEOUT': 60 * 60 * 24, # 1 day default (in secs)
    'CACHE_KEY_PREFIX': 'superset_results',
    'CACHE_REDIS_URL': 'redis://%s:%s/0' % (REDIS_HOST, REDIS_PORT),
}


MAPBOX_API_KEY = os.environ.get('MAPBOX_API_KEY', '')

ENABLE_SCHEDULED_EMAIL_REPORTS = True

EMAIL_NOTIFICATIONS = True  # all the emails are sent using dryrun
SMTP_HOST = 'smtp.gmail.com'
SMTP_STARTTLS = True
SMTP_SSL = False
SMTP_USER = ''
SMTP_PORT = 587
SMTP_PASSWORD = ''
SMTP_MAIL_FROM = 'superset@superset.com'

EMAIL_REPORTS_WEBDRIVER = 'firefox'

WEBDRIVER_BASEURL = 'http://0.0.0.0:9099/'


# Uncomment below code if running behind a proxy server(nginx) and mapped to
# prefix url(ex: # xxx.host.com/superset)
# class ReverseProxied(object):
#
#     def __init__(self, app):
#         self.app = app
#
#     def __call__(self, environ, start_response):
#         script_name = environ.get('HTTP_X_SCRIPT_NAME', '')
#         if script_name:
#             environ['SCRIPT_NAME'] = script_name
#             path_info = environ['PATH_INFO']
#             if path_info.startswith(script_name):
#                 environ['PATH_INFO'] = path_info[len(script_name):]
#
#         scheme = environ.get('HTTP_X_SCHEME', '')
#         if scheme:
#             environ['wsgi.url_scheme'] = scheme
#         return self.app(environ, start_response)
#
#
# ADDITIONAL_MIDDLEWARE = [ReverseProxied, ]
