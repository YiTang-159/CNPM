# Build frontend with only public config. Never send credentials to this build context.
FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
ARG VITE_API_URL=/backend
ARG VITE_PAYMENT_API_URL=/backend
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PAYMENT_API_URL=$VITE_PAYMENT_API_URL
ENV VITE_ENABLE_PAYMENT_DEMO=false
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
