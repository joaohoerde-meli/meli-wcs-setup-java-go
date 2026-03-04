import { getI18n } from 'nordic/i18n';
import { Island } from 'nordic/islands';
import { Typography } from '@andes/react/typography';

import { getSorter } from '../../../../services/wcs-service';
import { GraphEditorApp } from './ui-components/graph-editor-app';

const SAFE_SORTER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

const EditorPage = ({ sorterData, isNew, error }) => {
  const i18n = getI18n();

  const pageTitle = isNew
    ? i18n.gettext('New sorter')
    : sorterData?.sorter_name ?? i18n.gettext('Editor');

  return (
    <div className="wcs-editor-page">
      <meta name="description" content={i18n.gettext('WCS Topology Editor')} />

      <div className="wcs-editor-page__header">
        <nav aria-label={i18n.gettext('Breadcrumb')}>
          <ol className="wcs-editor-page__breadcrumb">
            <li>
              <a href="/wcs-setup">{i18n.gettext('WCS Setup')}</a>
            </li>
            <li aria-current="page">{pageTitle}</li>
          </ol>
        </nav>
        <Typography component="h1" size="l" weight="semibold">
          {pageTitle}
        </Typography>
      </div>

      {error && (
        <div className="wcs-editor-page__error" role="alert">
          <Typography component="p" color="negative">
            {i18n.gettext('Could not load sorter data. Please try again later.')}
          </Typography>
        </div>
      )}

      {!error && (
        <div className="wcs-editor-page__canvas">
          <Island>
            <GraphEditorApp initialData={sorterData} isNew={isNew} />
          </Island>
        </div>
      )}
    </div>
  );
};

export const getServerSideProps = async (req) => {
  const { sorterId } = req.params;
  const isNew = sorterId === 'new';

  if (isNew) {
    return {
      props: { sorterData: null, isNew: true, error: null },
      settings: { title: req.i18n.gettext('New sorter — WCS Setup') },
    };
  }

  if (!SAFE_SORTER_ID_PATTERN.test(sorterId)) {
    return {
      props: { sorterData: null, isNew: false, error: true },
      settings: { title: req.i18n.gettext('Editor — WCS Setup') },
    };
  }

  const { data: sorterData, error } = await getSorter(sorterId);

  if (error) {
    return {
      props: { sorterData: null, isNew: false, error: true },
      settings: { title: req.i18n.gettext('Editor — WCS Setup') },
    };
  }

  return {
    props: { sorterData, isNew: false, error: null },
    settings: { title: `${sorterData.sorter_name} — ${req.i18n.gettext('WCS Setup')}` },
  };
};

export const setPageSettings = ({ settings }) => ({
  title: settings.title,
  melidata: {
    path: '/wcs_setup/editor',
    event_data: {
      page_type: 'editor',
      feature: 'wcs_setup',
    },
  },
});

export const hydrate = 'islands';

export default EditorPage;
