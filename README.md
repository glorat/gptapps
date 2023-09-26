# Gptapps (gptapps)

Gptapps - A collection of simple useful apps built on top of openai GPT

This PWA web app provides a sandbox for developers to test out openai/GPT capability by just providing a relevant API key.

Unlike other demo apps out there, this one is probably unique in providing a full range of GPT/langchain capabilities without having any backend service. With no backend, your data and API keys are secure within your browser environment.

Treat this as a sandbox demo app. It should not be used for production purposes since, without a backend, it relies on your API key being provided to the app

## Prerequisites
Mandatory:
Either an [openai.com API key](https://platform.openai.com/account/api-keys), or an Azure openai endpoint and API key. This should be entered in the settings page

Optional: Endpoint for [unstructured-api](https://github.com/Unstructured-IO/unstructured-api) service. Please follow their instructions for setup. Setting up this endpoint will allow arbitrary files to be uploaded into the browser for Q&A

## Local development
```bash
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

### Build the app for production
```bash
quasar build
```
