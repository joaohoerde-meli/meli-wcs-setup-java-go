import { createLayoutMiddleware } from 'nordic/layout';
import { createNordicI18nMiddlewares } from 'nordic/i18n';

export default (app) => {
  app.use(createLayoutMiddleware());
  app.use(...createNordicI18nMiddlewares());
};
