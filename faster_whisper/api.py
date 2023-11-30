from flask import Flask, abort, request
from flask.logging import default_handler
from tempfile import NamedTemporaryFile
from log import getlogger

import logging
import model
import os

app = Flask(__name__)

logger = getlogger()
logger.addHandler(default_handler)
logging.getLogger("faster_whisper").addHandler(default_handler)

model = model.load()

if "DEBUG" in os.environ:
    logger.setLevel(logging.DEBUG)


@app.route('/', methods=['POST'])
def handler():
    logger.debug("handler is running ")
    if not request.files:
        # If the user didn't submit any files, return a 400 (Bad Request) error.
        abort(400)

    # For each file, let's store the results in a list of dictionaries.
    results = []

    # Loop over every file that the user submitted.
    for filename, handle in request.files.items():
        logger.debug(f"Processing file {filename}")
        # Create a temporary file.
        # The location of the temporary file is available in `temp.name`.
        temp = NamedTemporaryFile()
        # Write the user's uploaded file to the temporary file.
        # The file will get deleted when it drops out of scope.
        logger.debug(f"Saving to {temp.name}")
        handle.save(temp)
        # Let's get the transcript of the temporary file.
        segments, _ = model.transcribe(temp.name, vad_filter=True)
        message = ""
        for segment in segments:
            message += segment.text
        logger.warning(f"Result: {message}")
        # Now we can store the result object for this file.
        results.append({
            'filename': filename,
            'transcript': message,
        })

    # This will be automatically converted to JSON.
    return {'results': results}
