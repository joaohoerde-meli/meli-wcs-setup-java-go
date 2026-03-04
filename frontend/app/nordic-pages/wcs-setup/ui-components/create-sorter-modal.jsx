import { useState } from 'react';
import { getI18n } from 'nordic/i18n';
import { Button } from '@andes/react/button';
import { EventualModal } from '@andes/react/modal';
import { TextField } from '@andes/react/textfield';
import { Typography } from '@andes/react/typography';
import Add from '@andes/react/icons/Add';

import { createSorter } from '../../../../services/wcs-service';

const EMPTY_FORM = { sorterId: '', sorterName: '' };
const SAFE_SORTER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export const CreateSorterModal = () => {
  const i18n = getI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const next = {};

    if (!form.sorterId.trim()) {
      next.sorterId = i18n.gettext('Sorter ID is required.');
    } else if (form.sorterId.length > 64) {
      next.sorterId = i18n.gettext('Sorter ID must be 64 characters or fewer.');
    }

    if (!form.sorterName.trim()) {
      next.sorterName = i18n.gettext('Sorter name is required.');
    } else if (form.sorterName.length > 128) {
      next.sorterName = i18n.gettext('Sorter name must be 128 characters or fewer.');
    }

    return next;
  };

  const handleOpen = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setServerError(null);
    setOpen(true);
  };

  const handleDismiss = () => {
    if (!saving) {
      setOpen(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      return;
    }

    setSaving(true);
    setServerError(null);

    const payload = {
      sorter_id: form.sorterId.trim(),
      sorter_name: form.sorterName.trim(),
      nodes: [],
      edges: [],
    };

    const { data, error } = await createSorter(payload);

    if (error) {
      setSaving(false);

      if (error.status === 409) {
        setErrors({ sorterId: i18n.gettext('A sorter with this ID already exists.') });
      } else if (error.errors) {
        setServerError(error.errors.join(' '));
      } else {
        setServerError(i18n.gettext('Could not create sorter. Please try again.'));
      }

      return;
    }

    // Navigate to the editor for the newly created sorter
    const newSorterId = data.sorter_id;

    if (SAFE_SORTER_ID_PATTERN.test(newSorterId)) {
      window.location.href = `/wcs-setup/editor/${newSorterId}`;
    } else {
      setSaving(false);
      setServerError(i18n.gettext('Could not navigate to the new sorter. Please refresh the page.'));
    }
  };

  return (
    <>
      <Button
        hierarchy="loud"
        size="medium"
        icon={{ left: <Add size="xtiny" /> }}
        onClick={handleOpen}
      >
        {i18n.gettext('New sorter')}
      </Button>

      <EventualModal
        open={open}
        title={i18n.gettext('Create sorter')}
        onDismiss={handleDismiss}
        dismissible={!saving}
        actions={
          <>
            <Button
              hierarchy="quiet"
              size="medium"
              onClick={handleDismiss}
              disabled={saving}
              type="button"
            >
              {i18n.gettext('Cancel')}
            </Button>
            <Button
              hierarchy="loud"
              size="medium"
              loading={saving}
              onClick={handleSubmit}
              type="submit"
            >
              {saving ? i18n.gettext('Creating…') : i18n.gettext('Create')}
            </Button>
          </>
        }
      >
        <form className="create-sorter-modal__form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="create-sorter-modal__server-error" role="alert">
              <Typography component="p" size="s" color="negative">
                {serverError}
              </Typography>
            </div>
          )}

          <div className="create-sorter-modal__field">
            <TextField
              label={i18n.gettext('Sorter ID')}
              value={form.sorterId}
              onChange={handleChange('sorterId')}
              error={Boolean(errors.sorterId)}
              helper={errors.sorterId}
              placeholder={i18n.gettext('e.g. SORTER-001')}
              maxLength={64}
              disabled={saving}
              id="create-sorter-id"
            />
          </div>

          <div className="create-sorter-modal__field">
            <TextField
              label={i18n.gettext('Sorter name')}
              value={form.sorterName}
              onChange={handleChange('sorterName')}
              error={Boolean(errors.sorterName)}
              helper={errors.sorterName}
              placeholder={i18n.gettext('e.g. Main Distribution Sorter')}
              maxLength={128}
              disabled={saving}
              id="create-sorter-name"
            />
          </div>
        </form>
      </EventualModal>
    </>
  );
};
