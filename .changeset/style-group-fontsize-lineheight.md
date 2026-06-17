---
"@eaeao/summernote-react": minor
---

The default toolbar's **Style** group now includes the **font size** and **line height** dropdowns next to the style / format-block picker, rendered as a connected segmented button group (like the bold/underline group). The `fontSize` / `lineHeight` commands and the `fontsize` / `height` toolbar items already existed — this wires them into the default toolbar, tags their toggles `note-btn-size` / `note-btn-height`, and adds CSS so several controls inside one toolbar group connect with overlapping borders and rounded outer corners.
