# GitHub Pages Deployment Instructions

This project is configured to deploy to GitHub Pages. Follow these steps:

## Prerequisites
- Node.js 18+ installed
- Git configured with GitHub account

## Configuration
1. **Repository Name**: Update the `repoName` variable in `next.config.ts` to match your GitHub repository name
2. **Environment**: The project automatically detects production environment for GitHub Pages

## Deployment Methods

### Method 1: Automatic Deployment (Recommended)
1. Push your code to the `main` branch
2. GitHub Actions will automatically build and deploy to GitHub Pages
3. Your site will be available at: `https://[username].github.io/[repository-name]/`

### Method 2: Manual Deployment
1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Deploy to GitHub Pages: `npm run deploy`

## GitHub Repository Settings
1. Go to your repository on GitHub
2. Navigate to Settings → Pages
3. Set source to "Deploy from a branch"
4. Select the `gh-pages` branch
5. Click Save

## Important Notes
- Images are unoptimized for GitHub Pages compatibility
- The site uses static export (`output: 'export'`)
- Base path is automatically configured for GitHub Pages subdirectory
- The `.nojekyll` file prevents GitHub from treating this as a Jekyll site

## Troubleshooting
- If images don't appear, check that the repository name in `next.config.ts` matches your GitHub repo
- Ensure the `gh-pages` branch exists and is selected in repository settings
- Check GitHub Actions tab for build errors

## Local Development
- Run `npm run dev` for development server
- The base path is only applied in production, so local development works normally