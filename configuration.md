# Configuration Guide

This guide explains how to configure the application with real data, including Jira integration, Database settings, and Excel sheet paths.

## 1. Jira Configuration
Jira settings are configured in the `confluence-config.json` file located at the root of the project. This file is used to connect to your Jira/Confluence instance.

**File: `confluence-config.json`**
```json
{
    "confluence": {
        "baseUrl": "https://<your-domain>.atlassian.net/wiki",
        "username": "<your-jira-email-or-service-account>",
        "apiToken": "<your-api-token>",
        "targetSpaceKey": "PM",
        "targetPageId": "<page-id>"
    }
}
```
* **baseUrl**: The base URL of your Atlassian wiki/Jira instance.
* **username**: The email or service account used to authenticate.
* **apiToken**: The API token generated from your Atlassian account settings.
* **targetSpaceKey**: The space key where pages/data will be targeted.
* **targetPageId**: The specific page ID for publishing or retrieving data.

## 2. Database Configuration
By default, the application uses a SQLite database named `database.sqlite` (configured in `server/db.js`). 

If you want to customize your database connection, you can define settings in `db-config.json` at the root of the project.

**File: `db-config.json`**
```json
{
  "database": {
    "dialect": "sqlite",
    "storage": "database.sqlite"
  }
}
```
* **dialect**: The type of database (e.g., `sqlite`, `postgres`, `mysql`). Currently defaults to `sqlite`.
* **storage**: The file path for SQLite (e.g., `database.sqlite` or an absolute path like `/var/data/database.sqlite`).

*Note: If `db-config.json` is not present, the system will fall back to the default `database.sqlite` in the server root.*

## 3. Excel Sheet Path Configuration (Import & Download Template)
Excel imports and template downloads are typically handled via the frontend UI (where users upload a file or click to download a template). However, if you need to set absolute paths for backend processing or default templates, they can be specified in an `excel-config.json` or within your environment variables.

To configure real data paths for Excel:

**File: `excel-config.json` (Create if needed)**
```json
{
    "excel": {
        "importPath": "./data/imports/data_import.xlsx",
        "downloadTemplatePath": "./public/templates/import_template.xlsx"
    }
}
```
* **importPath**: The default path on the server where uploaded Excel files are temporarily stored or read from.
* **downloadTemplatePath**: The path to the blank Excel template that users can download to fill out.

### Using Real Data
To ensure everything uses real data:
1. Replace the placeholder values in `confluence-config.json` with your actual Atlassian credentials.
2. Keep `database.sqlite` persistent and do not delete it, or update `db-config.json` to point to your production database file/URL.
3. Place your real Excel templates in the `downloadTemplatePath` location.
