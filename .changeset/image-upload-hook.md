---
"@eaeao/summernote-react": minor
---

Add an `onImageUpload` hook for custom image uploads. By default a picked image is embedded as a base64 data URL; pass `onImageUpload={async (file) => uploadAndReturnUrl(file)}` to upload the file your own way (your server, S3, …) and return — or resolve to — the image `src` to insert (a hosted URL, or a base64 string). A loading spinner shows in place while the promise resolves; on rejection the placeholder is removed. The picture dialog's file input is now single-file. Exposed as the `ImageUploadHandler` type and `core.insertImageUpload(file, handler)`.
