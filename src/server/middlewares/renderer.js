/* global ASSETS_BY_CHUNK_NAME */
import render from '../render';
import config from '../../../config';

export default () => function* rendererMiddleware() {
    const { renderProps, store } = this.state;
    const assetsByChunkName = (
      ASSETS_BY_CHUNK_NAME || this.res.locals.webpackStats.toJson().assetsByChunkName
    );
    let mainEntry = assetsByChunkName[config.client.name];
    if (Array.isArray(mainEntry)) mainEntry = mainEntry[0];

    this.body = yield render(renderProps, store, mainEntry);
};
