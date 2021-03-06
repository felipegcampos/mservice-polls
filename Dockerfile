FROM makeomatic/node:$NODE_VERSION

ENV NCONF_NAMESPACE=MS_POLLS \
    NODE_ENV=$NODE_ENV

WORKDIR /src

COPY package.json .
RUN \
  apk --update add --virtual .buildDeps \
    build-base \
    python \
    git \
    curl \
    openssl \
  && npm install --production \
  && npm dedupe \
  && apk del \
    .buildDeps \
    wget \
  && rm -rf \
    /tmp/* \
    /root/.node-gyp \
    /root/.npm \
    /etc/apk/cache/* \
    /var/cache/apk/*

COPY . /src
RUN  chown -R node /src
USER node

EXPOSE 3000
