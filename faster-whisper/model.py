import os
import pathlib

from faster_whisper import WhisperModel
from log import getlogger

import logging
import env

logger = getlogger()

if env.DEBUG:
    logging.getLogger('faster_whisper').setLevel(logging.DEBUG)


def load():
    logger.info(f'Loading model {env.MODEL_SIZE} for {env.DEVICE}, '
                f'type {env.COMPUTE_TYPE} with {env.CPU_THREADS} threads '
                f'and {env.NUM_WORKERS} workers.')
    download_root = env.DOWNLOAD_ROOT
    download_root = pathlib.Path(os.getcwd()) / 'models' if download_root is None else pathlib.Path(download_root)
    download_root.mkdir(parents=True, exist_ok=True)
    logger.info(f'Model will be stored in {download_root}')

    return WhisperModel(
        model_size_or_path=env.MODEL_SIZE,
        device=env.DEVICE,
        compute_type=env.COMPUTE_TYPE,
        cpu_threads=env.CPU_THREADS,
        num_workers=env.NUM_WORKERS,
        download_root=download_root,
    )


if __name__ == '__main__':
    logger.info('Preloading model')
    load()
    logger.info('Preloading complete')
