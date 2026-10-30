# ed-neema.github.io

Personal site of Ednah Akoth. Plain HTML, CSS and JavaScript, no build step.

## Files

- `index.html` holds the intro, about, research, experience and education. Edit the text directly.
- `publications.json` lists papers, with a short summary and any sections you want to link to.
- `questions.json` lists the open questions, grouped by theme.
- `posts.json` lists blog posts. `posts/` holds one Markdown file per published post.
- `style.css` holds the colors and type. The palette is the first block of the file.
- `photo.jpg` (add it yourself) is the portrait in the intro. Until it exists, the initials show instead.

## Publishing a post

1. Write the post in Markdown and save it as `posts/your-post-name.md`.
2. In `posts.json`, find the entry with `"slug": "your-post-name"` (or add one) and set:
   - `"status": "published"`
   - `"date": "YYYY-MM-DD"`
   - `"tags"`: a short list, reusing existing tags where you can
3. Commit. GitHub Pages updates the site in about a minute.

Only posts marked `published` appear on the site. Anything else stays hidden.

## Linking a post to a section of a paper

Add a `related` list to the post's entry in `posts.json`. A box at the top of the post then links to that section:

```json
"related": [
  { "paper": "no-one-is-counting", "section": "regulatory-gap" }
]
```

`paper` is the paper's `id` and `section` is a section `id`, both from `publications.json`. To link a new section, add it to that paper's `sections` list with its title and page number.

Inside the post text you can also link to the section's entry on this site:

```markdown
[the legal analysis in our paper](./#pub-no-one-is-counting-regulatory-gap)
```

Google Drive links open the paper at the first page, so the section label shows the page number. Once the paper has a direct PDF link (for example on arXiv), put that in `url` and section links will open on the right page.

## Adding a publication

Add an entry to `publications.json` with an `id`, `title`, `authors`, `status`, `url` and a one or two sentence `summary`. Remove `status` once the paper is out.
