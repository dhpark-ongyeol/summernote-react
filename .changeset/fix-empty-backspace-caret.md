---
"@eaeao/summernote-react": patch
---

Fix a caret bug in an empty editor: pressing Backspace (or Delete) deleted the last empty paragraph, leaving the editable with no block wrapper (`innerHTML=""`). Typing the next character then landed the caret *before* it — a controlled `value` re-seed reassigned the content and dropped the caret to the editable's start. Backspace/Delete now no-op when the editor is already empty, keeping the `<p><br></p>` wrapper, so the caret stays after the typed character.
