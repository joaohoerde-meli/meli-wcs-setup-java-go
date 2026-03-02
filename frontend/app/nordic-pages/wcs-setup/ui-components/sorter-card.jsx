import { useState } from 'react';
import { getI18n } from 'nordic/i18n';
import { Button } from '@andes/react/button';
import { ConfirmationModal } from '@andes/react/modal';
import { ProgressIndicatorCircular } from '@andes/react/progress-indicator-circular';
import { Typography } from '@andes/react/typography';
import Edit from '@andes/react/icons/Edit';
import Delete from '@andes/react/icons/Delete';

import { deleteSorter } from '../../../../services/wcs-service';

export const SorterCardActions = ({ sorterId, sorterName }) => {
  const i18n = getI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    const { error } = await deleteSorter(sorterId);

    if (error) {
      setDeleting(false);
      setDeleteError(i18n.gettext('Could not delete sorter. Please try again.'));

      return;
    }

    // Reload the page to reflect the deletion
    window.location.reload();
  };

  return (
    <div className="sorter-card-actions">
      <Button
        hierarchy="quiet"
        size="small"
        href={`/wcs-setup/editor/${sorterId}`}
        icon={{ left: <Edit size="xtiny" /> }}
      >
        {i18n.gettext('Open editor')}
      </Button>

      <Button
        hierarchy="quiet"
        size="small"
        onClick={() => setConfirmOpen(true)}
        icon={{ left: <Delete size="xtiny" /> }}
      >
        {i18n.gettext('Delete')}
      </Button>

      {deleteError && (
        <Typography component="span" size="xs" color="negative" className="sorter-card-actions__error">
          {deleteError}
        </Typography>
      )}

      <ConfirmationModal
        open={confirmOpen}
        title={i18n.gettext('Delete {0}?', sorterName)}
        onDismiss={() => setConfirmOpen(false)}
        actions={
          <>
            <Button
              hierarchy="quiet"
              size="medium"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              {i18n.gettext('Cancel')}
            </Button>
            <Button
              hierarchy="loud"
              size="medium"
              onClick={handleDelete}
              loading={deleting}
            >
              {deleting
                ? i18n.gettext('Deleting…')
                : i18n.gettext('Delete')}
            </Button>
          </>
        }
      >
        <Typography component="p">
          {i18n.gettext('This action cannot be undone. All topology data will be permanently lost.')}
        </Typography>
        {deleting && (
          <ProgressIndicatorCircular modifier="inline" size="small" srLabel={i18n.gettext('Deleting…')} />
        )}
      </ConfirmationModal>
    </div>
  );
};
