# public/

Static files served at the site root.

## Background image

The app shows a blurred sky photo behind the UI. **Save your image here as:**

```
public/sky.jpg
```

That's the exact filename the layout looks for (`app/layout.tsx` → `bg-[url('/sky.jpg')]`).
If the file is missing, the background just falls back to plain white — nothing breaks.

To use a different name or format (e.g. `sky.png`), update the URL in
`app/layout.tsx`.
