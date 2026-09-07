# syntax=docker/dockerfile:1

###
# Build stage
###
FROM node:22-alpine AS builder

# Vite inlines these values into the bundle at build time, so they must be set
# before `yarn build` (and a rebuild is required to change any of them).
# Values passed here take precedence over the defaults in `frontend/.env`.
ARG VITE_APP_NAME
ARG VITE_APP_DESCRIPTION
ARG VITE_APP_LANG
ARG VITE_BACKEND_URL
ARG VITE_BACKEND_CLIENT_ID
ARG VITE_SHAPE_REPOSITORY_URL=https://shapes.activitypods.org/
ARG VITE_ORGANIZATION_NAME
ARG VITE_ORGANIZATION_URL
ARG VITE_POD_PROVIDER_BASE_URL
ARG VITE_MAPBOX_ACCESS_TOKEN

ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_DESCRIPTION=$VITE_APP_DESCRIPTION \
    VITE_APP_LANG=$VITE_APP_LANG \
    VITE_BACKEND_URL=$VITE_BACKEND_URL \
    VITE_BACKEND_CLIENT_ID=$VITE_BACKEND_CLIENT_ID \
    VITE_SHAPE_REPOSITORY_URL=$VITE_SHAPE_REPOSITORY_URL \
    VITE_ORGANIZATION_NAME=$VITE_ORGANIZATION_NAME \
    VITE_ORGANIZATION_URL=$VITE_ORGANIZATION_URL \
    VITE_POD_PROVIDER_BASE_URL=$VITE_POD_PROVIDER_BASE_URL \
    VITE_MAPBOX_ACCESS_TOKEN=$VITE_MAPBOX_ACCESS_TOKEN

WORKDIR /app/frontend

# Install packages first so that Docker doesn't run `yarn install` if the packages haven't changed
# See https://making.close.com/posts/reduce-docker-image-size
ADD frontend/package.json /app/frontend
ADD frontend/yarn.lock /app/frontend
RUN yarn install --frozen-lockfile && yarn cache clean

ADD frontend /app/frontend

RUN yarn run build

###
# Runtime stage
###
FROM node:22-alpine

WORKDIR /app/frontend

RUN yarn global add serve && yarn cache clean

COPY --from=builder /app/frontend/dist ./dist

EXPOSE 4000

CMD [ "serve", "-s", "dist", "-l", "4000" ]
