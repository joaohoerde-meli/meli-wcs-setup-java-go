import { getI18n } from 'nordic/i18n';
import { Island } from 'nordic/islands';
import { Typography } from '@andes/react/typography';
import { EmptyStateWithIllustration } from '@andes/react/empty-state';
import NoProductsLarge from '@andes/react/illustrations/NoProductsLarge';

import { getSorters } from '../../../services/wcs-service';
import { SorterCardActions } from './ui-components/sorter-card';
import { CreateSorterModal } from './ui-components/create-sorter-modal';

const WcsSetupPage = ({ sorters, error }) => {
  const i18n = getI18n();

  return (
    <div className="wcs-setup">
      <meta name="description" content={i18n.gettext('WCS Topology Setup — manage sorter configurations')} />

      <div className="wcs-setup__header">
        <Typography component="h1" size="xl" weight="semibold">
          {i18n.gettext('WCS Topology Setup')}
        </Typography>
        <Island>
          <CreateSorterModal />
        </Island>
      </div>

      {error && (
        <div className="wcs-setup__error" role="alert">
          <Typography component="p" color="negative">
            {i18n.gettext('Could not load sorters. Please try again later.')}
          </Typography>
        </div>
      )}

      {!error && sorters && sorters.length === 0 && (
        <EmptyStateWithIllustration
          title={i18n.gettext('No sorters yet')}
          description={i18n.gettext('Create your first sorter to start building WCS topologies.')}
          illustration={<NoProductsLarge />}
          size="large"
        />
      )}

      {!error && sorters && sorters.length > 0 && (
        <ul className="wcs-setup__grid" aria-label={i18n.gettext('Sorter list')}>
          {sorters.map((sorter) => (
            <li key={sorter.id} className="wcs-setup__grid-item">
              <article className="wcs-setup__card">
                <div className="wcs-setup__card-body">
                  <Typography component="h2" size="m" weight="semibold" className="wcs-setup__card-title">
                    {sorter.sorter_name}
                  </Typography>
                  <Typography component="p" size="s" color="secondary" className="wcs-setup__card-id">
                    {sorter.sorter_id}
                  </Typography>
                  <div className="wcs-setup__card-meta">
                    <Typography component="span" size="xs" color="secondary">
                      {i18n.gettext('{0} nodes · {1} edges', sorter.node_count, sorter.edge_count)}
                    </Typography>
                  </div>
                </div>
                <div className="wcs-setup__card-actions">
                  <Island>
                    <SorterCardActions sorterId={sorter.sorter_id} sorterName={sorter.sorter_name} />
                  </Island>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const getServerSideProps = async (req) => {
  const { data: sorters, error } = await getSorters();

  if (error) {
    return {
      props: { sorters: [], error: true },
      settings: { title: req.i18n.gettext('WCS Setup') },
    };
  }

  return {
    props: { sorters: sorters || [], error: null },
    settings: { title: req.i18n.gettext('WCS Setup') },
  };
};

export const setPageSettings = ({ settings }) => ({
  title: settings.title,
  melidata: {
    path: '/wcs_setup/list',
    event_data: {
      page_type: 'list',
      feature: 'wcs_setup',
    },
  },
});

export const hydrate = 'islands';

export default WcsSetupPage;
