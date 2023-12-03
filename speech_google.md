# Using Google Speech-to-Text API

Google offers a [Speech-to-Text API](https://cloud.google.com/speech-to-text) that can be used to transcribe audio files
to text.

The API requires us to upload the voice audio to Google Cloud Storage to also support audio snippets that are longer
than 1 minute.

[!NOTE]  
Using Google Cloud Storage and Google Speech-to-Text can result in costs that you will be charged for from Google.

## 1. Workflow

1. Download the voice audio from WhatsApp
2. Upload the voice audio to Google Cloud Storage
3. Call the Speech-to-Text API pointing to the audio file in Google Cloud Storage
4. Parse the returned transcription

## 2. Setup the Google Cloud project

Go to the [Google Cloud console](https://console.cloud.google.com) and login with your account. If you don't have one
yet, create one.

In one of the following steps you will be asked to setup billing, otherwise you will not be able to enable certain
Google Cloud services.
Follow the instruction to setup billing.

### 2.1 Create a cloud project

Go to https://cloud.google.com/resource-manager/docs/creating-managing-projects and follow the instructions to create a
cloud project.

### 2.2 Create a Google Cloud Storage bucket

In order to store files in Google Cloud Storage, we first need to create a bucket.

1. Go to https://console.cloud.google.com/storage and create a new bucket.
2. Ensure _Public Access_ is restricted!
3. Setup a _Lifecycle_ rule for this bucket to delete all data that is older than 1 day.
    - Our script doesn't automatically delete the uploaded audio files. Instead let Google Cloud automatically delete
      any file older than 1 day to prevent any excess in costs.

### 2.3 Enable Speech-to-Text API

Follow the instructions
on https://cloud.google.com/speech-to-text/docs/before-you-begin#setting_up_your_google_cloud_platform_project to enable
Speech-To-Text.

- You don't need to enable _Data logging_ which comes with additional costs-per-usage.
- Don't create a service account yet. We will do this in the next step.

### 2.4 Create a service account

Follow the instructions on https://cloud.google.com/iam/docs/service-accounts-create#creating to create a service
account.

- In section *Grant this service account access to project* select role `Storage Object User`
    - This role can upload, modify and delete files from the bucket.
- Skip section *Grant users access to this service account*
- Once you created the service account, go to *Manage keys* for this account and create a new key. Select format *JSON*
  when asked.

A download with the key will automatically start. We need this key to later access the Speech-to-Text API and to upload
files to Cloud Storage.

[!CAUTION]  
Never upload the downloaded JSON key to GitHub or other publicly accessible locations!

### 2.5 Create a budget alert for exceeded costs

Create a budget alert that notifies you once a certain cost per month is exceeded.

This will not shut down any running services, it is only a notification for you where you can take action on, like
turning down the node container that connects to your Google Cloud project.

Go to https://cloud.google.com/billing/docs/how-to/budgets and follow the instructions to create a budget alert.

Since the costs for this project should be very low, a recommended alert threshold is USD $10.

[!IMPORTANT]  
Setting up a budget alert is strongly recommended. An alert could unveil that your setup is malfunctioning, is getting
heavily abused or your service account's credentials are compromised. In any case, you should start investigating!

## 3. Configure our node service

### Environment variables

You need to pass the following environment variables in order to run our node service with the Google Speech-to-Text
API.

1. `SPEECH_RECOGNITION_SYSTEM = 'google'` to tell the node service to use the Google backends.
2. `GOOGLE_CLOUD_PROJECT_ID = 'project-id'` is your Google Cloud project ID.
3. `GOOGLE_CLOUD_SERVICE_ACCOUNT_CREDENTIALS_FILE = './path/to/the/service-account/credentials.json'` contains the path to the
   JSON key of our service account.
4. `GOOGLE_CLOUD_STORAGE_BUCKET = 'name-of-your-bucket'` points to the created Google Cloud Storage bucket.
5. `GOOGLE_CLOUD_SPEECH_LANGUAGE = 'de-CH'` should point to the BCP-47 language code of the most-spoken language of your
   voice messages.
6. `GOOGLE_CLOUD_SPEECH_ALTERNATIVE_LANGUAGES = 'en-US,it-IT,nl-BE'`. You can provide up to 3 alternative BCP-47
   language codes in which your voice messages are spoken.
    - Provide a single alternative language: `'de-CH'`
    - Do not add a trailing comma! Bad: `'de-CH,en-US,'`, Good: `'de-CH,en-US'`
    - If you do not provide any alternatives, simply omit this environment variable or provide an empty value `''`.
