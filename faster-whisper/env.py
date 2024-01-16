import os

DEBUG = 'DEBUG' in os.environ
MODEL_SIZE = os.environ['MODEL_SIZE']
DEVICE = os.environ.get('DEVICE', 'cpu')
COMPUTE_TYPE = os.environ.get('COMPUTE_TYPE', 'int8')
CPU_THREADS = os.environ.get('CPU_THREADS', 0)
NUM_WORKERS = os.environ.get('NUM_WORKERS', 1)
DOWNLOAD_ROOT = os.environ.get('DOWNLOAD_ROOT', None)
