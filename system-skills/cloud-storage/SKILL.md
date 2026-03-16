---
name: cloud-storage
description: Access and manage files in the user's cloud storage on the platform.
metadata: { "clawdbot": { "emoji": "☁️" } }
---

# Cloud Storage

You have access to the user's cloud storage on the Clawku platform. This is server-side storage (always available, no device required).

## CRITICAL: Converting Files Sent by User (WhatsApp/Telegram)

When a user sends you a file (PDF, DOCX, etc.) and asks to convert it, follow this workflow:

### Step 1: Upload the attachment to cloud storage

The file is at a local path (shown in the message). Read and upload it:

```
exec command="base64 -i '<mediaPath>'"
cloud_upload_base64 filename="document.pdf" contentBase64="<base64_output>"
```

This returns a `fileId`.

### Step 2: Convert the document

```
cloud_convert_document fileId="<fileId>" targetType="docx"
```

This returns a new `fileId`.

### Step 3: Send the converted file to user

```
cloud_send_file fileId="<newFileId>" caption="Here's your converted document!"
```

**COMPLETE EXAMPLE - User sends PDF, wants DOCX:**

```
1. exec command="base64 -i '/tmp/media/abc.pdf'"
2. cloud_upload_base64 filename="document.pdf" contentBase64="<output>"
3. cloud_convert_document fileId="<fileId>" targetType="docx"
4. cloud_send_file fileId="<newFileId>" caption="Here's your Word document!"
```

## Available Tools

### File Operations

- **cloud_storage_info** - Get storage quota, usage, and limits
- **cloud_list_files** - List files in a folder
- **cloud_list_folders** - List folders
- **cloud_get_file** - Get file info and download URL
- **cloud_read_file** - Read text file content
- **cloud_upload** - Upload text content as a file
- **cloud_upload_base64** - Upload base64-encoded binary files (USE THIS FOR ATTACHMENTS)
- **cloud_update_file** - Rename, move, or change visibility
- **cloud_delete_file** - Delete a file

### Folder Operations

- **cloud_create_folder** - Create a new folder
- **cloud_delete_folder** - Delete a folder and its contents

### Document Operations

- **cloud_extract_text** - Extract text from documents (PDF/DOCX/XLSX/PPTX)
- **cloud_create_document** - Create DOCX/XLSX/PPTX/PDF documents
- **cloud_convert_document** - Convert documents between formats

### Sharing & Sending

- **cloud_share_file** - Make a file public and get shareable URL
- **cloud_send_file** - Send a file directly to the user as a chat attachment

## Common Workflows

### Convert user's attachment and send back

```
1. exec command="base64 -i '<mediaPath>'"
2. cloud_upload_base64 filename="file.pdf" contentBase64="..."
3. cloud_convert_document fileId="<id>" targetType="docx"
4. cloud_send_file fileId="<newId>" caption="Done!"
```

### Create document and send to user

```
1. cloud_create_document type="docx" filename="report.docx" content="..."
2. cloud_send_file fileId="<id>" caption="Here's your report"
```

### Extract text from user's document

```
1. exec command="base64 -i '<mediaPath>'"
2. cloud_upload_base64 filename="doc.pdf" contentBase64="..."
3. cloud_extract_text fileId="<id>"
```

## Supported Conversions

| Source | Target Formats |
| ------ | -------------- |
| PDF    | docx, txt      |
| DOCX   | pdf, txt       |
| XLSX   | csv, pdf, txt  |
| PPTX   | pdf, txt       |
| CSV    | xlsx           |
| TXT    | docx, pdf      |

## Tips

- **Always use `cloud_send_file`** to deliver files to users - don't just share URLs
- Use `cloud_list_files` to find existing file IDs
- For document reading, prefer `cloud_extract_text` over `cloud_read_file`
- Set `isPublic=true` when creating/converting if you need a shareable URL
