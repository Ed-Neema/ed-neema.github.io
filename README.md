# ed-neema.github.io

Personal site of Ednah Akoth. Plain HTML, CSS and JavaScript, no build step.

## Files

- `index.html` holds the bio, research, experience, education and publications. Edit the text directly.
- `posts.json` lists every blog post.
- `posts/` holds one Markdown file per published post.
- `style.css` holds the colors and type. The palette is the first block of the file.

## Publishing a post

1. Write the post in Markdown and save it as `posts/your-post-name.md`.
2. In `posts.json`, find the entry with `"slug": "your-post-name"` (or add one) and set:
   - `"status": "published"`
   - `"date": "YYYY-MM-DD"`
   - `"tags"`: a short list, reusing existing tags where you can
3. Commit. GitHub Pages updates the site in about a minute.

Status values: `published` shows a linked post, `upcoming` shows it greyed out as coming soon, `draft` hides it.

## Adding a publication

Copy one `<li class="pub">` block in the Publications section of `index.html` and edit it. Change the status label or remove it once the paper is out, and wrap the title in a link to the paper.
