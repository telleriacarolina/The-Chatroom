{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "scripts": {
    "build": "npm run build --workspaces",
    "build:api": "npm run build -w @chatroom/api",
    "build:web": "npm run build -w @chatroom/web",
    "build:changed": "nx affected:build",
    "clean": "npm run clean --workspaces && rm -rf node_modules",
    "typecheck": "npm run typecheck --workspaces",
    "test": "npm test --workspaces",
    "test:api": "npm test -w @chatroom/api",
    "test:web": "npm test -w @chatroom/web",
    "test:coverage": "npm run test:coverage --workspaces",
    "test:watch": "npm test -- --watch --workspaces",
    "dev:frontend": "npm run dev -w @chatroom/web",
    "dev:backend": "npm run dev -w @chatroom/api -w @chatroom/socket",
    "lint:api": "npm run lint -w @chatroom/api",
    "format:all": "prettier --write '**/*.{ts,tsx,js,jsx,json}'",
    "nuke": "rm -rf node_modules packages/*/node_modules && npm install",
    "outdated": "npm outdated --workspaces",
    "update:all": "npm update --workspaces",
    "deps:check": "npm audit --workspaces",
    "deps:fix": "npm audit fix --workspaces"
  },
  "include": [
    "packages/api/src/routes/auth.js",
    "packages/web/src/components/chat/Block.tsx"
  ],
  "references": [
    { "path": "../shared" }
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  },
  "lint-staged": {
    "packages/**/*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  },
  "version": "independent",
  "npmClient": "npm",
  "command": {
    "version": {
      "conventionalCommits": true,
      "message": "chore(release): publish"
    }
  }
}

# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api
RUN npm install --workspace=@chatroom/api

FROM base AS api
WORKDIR /app/packages/api
CMD ["npm", "run", "start"]
