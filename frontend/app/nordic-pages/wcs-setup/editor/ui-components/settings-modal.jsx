import { useState, useEffect } from 'react';
import { getI18n } from 'nordic/i18n';
import { EventualModal } from '@andes/react/modal';
import { Button } from '@andes/react/button';
import { TextField } from '@andes/react/textfield';
import { Typography } from '@andes/react/typography';

export const SettingsModal = ({ open, constraints, onSave, onDismiss }) => {
  const i18n = getI18n();

  const [form, setForm] = useState({
    max_tu_weight_kg: constraints?.max_tu_weight_kg ?? '',
    length: constraints?.max_tu_dimensions_cm?.length ?? '',
    width: constraints?.max_tu_dimensions_cm?.width ?? '',
    height: constraints?.max_tu_dimensions_cm?.height ?? '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        max_tu_weight_kg: constraints?.max_tu_weight_kg ?? '',
        length: constraints?.max_tu_dimensions_cm?.length ?? '',
        width: constraints?.max_tu_dimensions_cm?.width ?? '',
        height: constraints?.max_tu_dimensions_cm?.height ?? '',
      });
      setErrors({});
    }
  }, [open, constraints]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    const weight = parseFloat(form.max_tu_weight_kg);

    if (form.max_tu_weight_kg !== '' && (isNaN(weight) || weight <= 0 || weight > 200)) {
      errs.max_tu_weight_kg = i18n.gettext('Must be between 0 and 200 kg.');
    }

    ['length', 'width', 'height'].forEach((dim) => {
      const val = parseFloat(form[dim]);

      if (form[dim] !== '' && (isNaN(val) || val <= 0)) {
        errs[dim] = i18n.gettext('Must be greater than 0.');
      }
    });

    return errs;
  };

  const handleSave = () => {
    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);

      return;
    }

    const toNum = (v) => (v === '' ? undefined : parseFloat(v));
    const updated = {
      max_tu_weight_kg: toNum(form.max_tu_weight_kg),
    };

    const l = toNum(form.length);
    const w = toNum(form.width);
    const h = toNum(form.height);

    if (l != null || w != null || h != null) {
      updated.max_tu_dimensions_cm = { length: l, width: w, height: h };
    }

    onSave(updated);
  };

  return (
    <EventualModal
      open={open}
      title={i18n.gettext('Global constraints')}
      onDismiss={onDismiss}
      actions={
        <>
          <Button hierarchy="quiet" size="medium" onClick={onDismiss} type="button">
            {i18n.gettext('Cancel')}
          </Button>
          <Button hierarchy="loud" size="medium" onClick={handleSave} type="button">
            {i18n.gettext('Apply')}
          </Button>
        </>
      }
    >
      <div className="settings-modal__form">
        <Typography component="p" size="s" color="secondary" className="settings-modal__hint">
          {i18n.gettext('Leave fields blank to remove the constraint.')}
        </Typography>

        <TextField
          label={i18n.gettext('Max TU weight (kg)')}
          value={String(form.max_tu_weight_kg)}
          type="number"
          min="0"
          max="200"
          onChange={handleChange('max_tu_weight_kg')}
          error={Boolean(errors.max_tu_weight_kg)}
          helper={errors.max_tu_weight_kg}
          size="small"
        />

        <Typography component="p" size="xs" weight="semibold" className="settings-modal__section">
          {i18n.gettext('Max TU dimensions (cm)')}
        </Typography>

        <div className="settings-modal__dimensions">
          <TextField
            label={i18n.gettext('Length')}
            value={String(form.length)}
            type="number"
            min="0"
            onChange={handleChange('length')}
            error={Boolean(errors.length)}
            helper={errors.length}
            size="small"
          />
          <TextField
            label={i18n.gettext('Width')}
            value={String(form.width)}
            type="number"
            min="0"
            onChange={handleChange('width')}
            error={Boolean(errors.width)}
            helper={errors.width}
            size="small"
          />
          <TextField
            label={i18n.gettext('Height')}
            value={String(form.height)}
            type="number"
            min="0"
            onChange={handleChange('height')}
            error={Boolean(errors.height)}
            helper={errors.height}
            size="small"
          />
        </div>
      </div>
    </EventualModal>
  );
};
