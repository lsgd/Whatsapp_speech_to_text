from faster_whisper import WhisperModel
from log import getlogger

import logging
import os


logger = getlogger()

if "DEBUG_MODEL" in os.environ or "DEBUG" in os.environ:
    logging.getLogger("faster_whisper").setLevel(logging.DEBUG)

def load():
    logger.info(os.environ)
    model_size = os.environ["MODEL_SIZE"]
    device = os.environ.get("DEVICE", "cpu")
    compute_type = os.environ.get("COMPUTE_TYPE", "int8")
    cpu_threads = os.environ.get("CPU_THREADS", 0)
    num_workers = os.environ.get("NUM_WORKERS", 1)
    download_root = os.environ.get("DOWNLOAD_ROOT", None)

    logger.info(f"Loading model {model_size}, for {device}, type \
                {compute_type} with {cpu_threads} threads and {num_workers} \
                workers.")
    if download_root is None:
        cwd = os.getcwd()
        download_root = os.path.join(cwd, "models")
        if not os.path.exists(download_root):
            os.mkdir(download_root)

    logger.info(f"Download_root is {download_root}")

    return WhisperModel(
                model_size_or_path=model_size,
                device=device,
                compute_type=compute_type,
                cpu_threads=cpu_threads,
                num_workers=num_workers,
                download_root=download_root,
            )


if __name__ == "__main__":
    logger.info("Preloading model")
    model = load()
    logger.info("Preloading complete")

